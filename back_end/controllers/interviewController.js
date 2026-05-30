const {
  generateInterviewResponse,
  generateInterviewFeedback,
} = require('../services/aiService');
const Interview = require('../models/interview');
const User = require('../models/User');
const { sendInterviewCompleteEmail } = require('../utils/email');

function normalizeText(value, fallback = '') {
  const text = String(value || '').trim();
  return text || fallback;
}

function buildAiContext(interview) {
  return {
    jobRole: interview.jobRole,
    company: interview.company,
    interviewType: interview.interviewType,
    difficulty: interview.difficulty,
    messages: interview.messages,
  };
}

// @route   POST /api/interviews/start
// @access  Private
exports.startInterview = async (req, res, next) => {
  try {
    const {
      jobRole,
      company,
      interviewType = 'mixed',
      difficulty = 'intermediate',
    } = req.body;

    const openingMessage = await generateInterviewResponse({
      jobRole: normalizeText(jobRole, 'Software Engineer'),
      company: normalizeText(company, 'General'),
      interviewType,
      difficulty,
      messages: [],
    });

    const interview = await Interview.create({
      user: req.user._id,
      jobRole: normalizeText(jobRole, 'Software Engineer'),
      company: normalizeText(company, 'General'),
      interviewType,
      difficulty,
      messages: [
        {
          role: 'ai',
          content: openingMessage,
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: 'Interview started!',
      interview,
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/interviews/:id/message
// @access  Private
exports.sendMessage = async (req, res, next) => {
  try {
    const interview = await Interview.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview session not found.' });
    }

    if (interview.status !== 'in-progress') {
      return res.status(400).json({ success: false, message: 'This interview session has already ended.' });
    }

    const message = normalizeText(req.body.message);
    if (!message) {
      return res.status(400).json({ success: false, message: 'Message cannot be empty.' });
    }

    interview.messages.push({ role: 'user', content: message });
    interview.questionsAnswered += 1;

    const [liveFeedback, aiReply] = await Promise.all([
      generateInterviewFeedback({
        ...buildAiContext(interview),
        answer: message,
        context: 'Live feedback for the candidate most recent answer.',
      }),
      generateInterviewResponse(buildAiContext(interview)),
    ]);

    interview.messages.push({ role: 'ai', content: aiReply });
    await interview.save();

    res.json({
      success: true,
      aiMessage: aiReply,
      feedback: liveFeedback,
      questionsAnswered: interview.questionsAnswered,
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/interviews/:id/complete
// @access  Private
exports.completeInterview = async (req, res, next) => {
  try {
    const interview = await Interview.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview not found.' });
    }

    if (interview.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Interview already completed.' });
    }

    const userMessages = interview.messages.filter((message) => message.role === 'user');
    const allAnswers = userMessages.map((message) => message.content).join('\n\n') || 'No candidate answers were provided.';
    const feedback = await generateInterviewFeedback({
      ...buildAiContext(interview),
      answer: allAnswers,
      context: 'Final interview report based on all candidate answers in this session.',
    });

    interview.status = 'completed';
    interview.feedback = feedback;
    interview.durationMinutes = req.body.durationMinutes || Math.ceil(interview.questionsAnswered * 2.5);
    await interview.save();

    const user = await User.findById(req.user._id);
    const allInterviews = await Interview.find({ user: req.user._id, status: 'completed' });
    const avgScore = Math.round(
      allInterviews.reduce((sum, item) => sum + (item.feedback?.overallScore || 0), 0) / allInterviews.length
    );

    user.stats.totalSessions = allInterviews.length;
    user.stats.avgScore = avgScore;
    user.stats.practiceHours = parseFloat(
      (allInterviews.reduce((sum, item) => sum + (item.durationMinutes || 0), 0) / 60).toFixed(1)
    );
    user.stats.lastSessionDate = new Date();
    await user.save({ validateBeforeSave: false });

    try {
      await sendInterviewCompleteEmail(user.email, user.name, interview.jobRole, {
        overall: feedback.overallScore,
        confidence: feedback.confidenceScore,
        communication: feedback.communicationScore,
        technical: feedback.technicalScore,
      });
    } catch (emailError) {
      console.error('Email send failed (non-critical):', emailError.message);
    }

    res.json({
      success: true,
      message: 'Interview completed! Great job.',
      interview,
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/interviews
// @access  Private
exports.getInterviews = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const filter = { user: req.user._id };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.type) filter.interviewType = req.query.type;

    const [interviews, total] = await Promise.all([
      Interview.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Interview.countDocuments(filter),
    ]);

    res.json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      interviews,
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/interviews/:id
// @access  Private
exports.getInterview = async (req, res, next) => {
  try {
    const interview = await Interview.findOne({ _id: req.params.id, user: req.user._id });

    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview not found.' });
    }

    res.json({ success: true, interview });
  } catch (error) {
    next(error);
  }
};

// @route   DELETE /api/interviews/:id
// @access  Private
exports.deleteInterview = async (req, res, next) => {
  try {
    const interview = await Interview.findOneAndDelete({ _id: req.params.id, user: req.user._id });

    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview not found.' });
    }

    res.json({ success: true, message: 'Interview deleted.' });
  } catch (error) {
    next(error);
  }
};