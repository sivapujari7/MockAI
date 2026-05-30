const {
  generateInterviewResponse,
  generateInterviewFeedback
} = require("../services/aiService");
const Interview = require('../models/interview');
const User = require('../models/User');
const { sendInterviewCompleteEmail } = require('../utils/email');

// ── AI question bank per type
const questionBank = {
  hr: [
    'Tell me about yourself and your background.',
    'What is your greatest professional strength?',
    'Describe a time you overcame a significant challenge.',
    'Where do you see yourself in 5 years?',
    'Why do you want to work at this company?',
    'Tell me about a time you worked in a team under pressure.',
    'What motivates you to do your best work?',
    'How do you handle criticism and feedback?',
    'Describe a situation where you showed leadership.',
    'What are your salary expectations?',
  ],
  technical: [
    'Explain the difference between a stack and a queue.',
    'What is time complexity? Give an example.',
    'Explain REST API principles.',
    'What is the difference between SQL and NoSQL databases?',
    'Explain how HTTPS works.',
    'What is a closure in JavaScript?',
    'Explain the concept of microservices.',
    'What is a binary search tree?',
    'How does garbage collection work?',
    'Explain CAP theorem.',
  ],
  behavioral: [
    'Describe a time you had a conflict with a colleague. How did you resolve it?',
    'Tell me about a project you are most proud of.',
    'Describe a time you failed and what you learned.',
    'How do you prioritize tasks when everything is urgent?',
    'Give an example of when you went above and beyond.',
  ],
  'system-design': [
    'Design a URL shortener like bit.ly.',
    'How would you design a scalable chat application?',
    'Design the backend for an e-commerce platform.',
    'How would you architect a video streaming service?',
    'Design a rate limiting system.',
  ],
  mixed: [
    'Tell me about yourself.',
    'What is your greatest technical achievement?',
    'Describe a challenging bug you fixed and how.',
    'How do you stay updated with new technologies?',
    'Walk me through a system you designed from scratch.',
  ],
};

// ── Simple AI feedback generator
const generateFeedback = (userMessage) => {
  const length = userMessage.length;
  const hasNumbers = /\d/.test(userMessage);
  const hasSTAR = /situation|task|action|result|challenge|solve|team/i.test(userMessage);

  const confidence = Math.min(95, Math.max(55,
    60 + (length > 100 ? 15 : 5) + (hasSTAR ? 10 : 0) + Math.floor(Math.random() * 10)
  ));
  const communication = Math.min(95, Math.max(55,
    65 + (length > 80 ? 10 : 0) + (hasSTAR ? 8 : 0) + Math.floor(Math.random() * 12)
  ));
  const technical = Math.min(95, Math.max(45,
    55 + (hasNumbers ? 15 : 0) + (length > 120 ? 10 : 0) + Math.floor(Math.random() * 15)
  ));

  const tips = [
    'Quantify your achievements with specific numbers and metrics.',
    'Use the STAR method: Situation, Task, Action, Result.',
    'Keep answers concise — aim for 90–120 seconds.',
    'Start with the outcome, then explain how you got there.',
    'Highlight your individual contribution clearly.',
    'Connect your experience directly to the job requirements.',
    'Show enthusiasm and genuine interest in the role.',
    'Avoid filler words like "um", "like", and "you know".',
  ];

  const strengths = length > 100 ? ['Good detail and depth', 'Clear communication'] : ['Concise response'];
  const improvements = !hasNumbers ? ['Add specific metrics and numbers'] : [];
  if (!hasSTAR) improvements.push('Use the STAR framework for behavioral answers');

  const overall = Math.round((confidence + communication + technical) / 3);

  return {
    overallScore: overall,
    confidenceScore: confidence,
    communicationScore: communication,
    technicalScore: technical,
    strengths,
    improvements,
    tips: tips.sort(() => 0.5 - Math.random()).slice(0, 3),
    summary: `Your response showed ${confidence >= 75 ? 'strong' : 'developing'} communication. ${improvements.length ? 'Focus on: ' + improvements.join(', ') + '.' : 'Good overall structure!'}`
  };
};

// ────────────────────────────────────────────
// @route   POST /api/interviews/start
// @access  Private
// ────────────────────────────────────────────
exports.startInterview = async (req, res, next) => {
  try {
    const { jobRole, company, interviewType = 'mixed', difficulty = 'intermediate' } = req.body;

    // Check free plan limit (5 sessions/month)
    if (req.user.plan === 'free') {
      const startOfMonth = new Date();
      startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);
      const count = await Interview.countDocuments({
        user: req.user._id,
        createdAt: { $gte: startOfMonth },
      });
      if (count >= 5) {
        return res.status(403).json({
          success: false,
          message: 'Free plan limit reached (5 interviews/month). Upgrade to Pro for unlimited sessions.',
        });
      }
    }

    const questions = questionBank[interviewType] || questionBank.mixed;
    const firstQuestion = questions[Math.floor(Math.random() * questions.length)];

    const interview = await Interview.create({
      user: req.user._id,
      jobRole,
      company: company || 'General',
      interviewType,
      difficulty,
      messages: [
        {
          role: 'ai',
          content: `Hello! I'm your MockAI interviewer for the **${jobRole}** role${company ? ` at **${company}**` : ''}. We'll do a ${interviewType} interview at ${difficulty} level. Let's begin!\n\n${firstQuestion}`,
        },
      ],
    });

    res.status(201).json({ success: true, message: 'Interview started!', interview });
  } catch (error) {
    next(error);
  }
};

// ────────────────────────────────────────────
// @route   POST /api/interviews/:id/message
// @access  Private
// ────────────────────────────────────────────
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

    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message cannot be empty.' });
    }

    // Add user message
    interview.messages.push({ role: 'user', content: message.trim() });
    interview.questionsAnswered += 1;

    // Generate live feedback for this message
   let liveFeedback;

try {
  const feedbackText =
    await generateInterviewFeedback(
      interview.jobRole,
      message
    );

  liveFeedback = JSON.parse(feedbackText);
} catch (err) {
  console.log("AI feedback error:", err.message);

  liveFeedback = generateFeedback(message);
}

    // Generate AI follow-up
    const questions = questionBank[interview.interviewType] || questionBank.mixed;
    const followUps = [
      'Can you elaborate on that with a specific example?',
      'How did that experience shape your approach going forward?',
      'What was the most challenging part of that situation?',
      `Great! Here's my next question: ${questions[Math.floor(Math.random() * questions.length)]}`,
      'Interesting. Can you quantify the impact of your actions?',
      'What would you do differently if you faced this again?',
    ];
 const aiReply =
  await generateInterviewResponse(
    interview.jobRole,
    message
  );
  interview.messages.push({
  role: "ai",
  content: aiReply
});

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

// ────────────────────────────────────────────
// @route   POST /api/interviews/:id/complete
// @access  Private
// ────────────────────────────────────────────
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

    // Generate final feedback from all user messages
    const userMessages = interview.messages.filter((m) => m.role === 'user');
    const allText = userMessages.map((m) => m.content).join(' ');
    const feedback = generateFeedback(allText || 'default response');

    interview.status = 'completed';
    interview.feedback = feedback;
    interview.durationMinutes = req.body.durationMinutes || Math.ceil(interview.questionsAnswered * 2.5);
    await interview.save();

    // Update user stats
    const user = await User.findById(req.user._id);
    const allInterviews = await Interview.find({ user: req.user._id, status: 'completed' });
    const avgScore = Math.round(
      allInterviews.reduce((sum, iv) => sum + (iv.feedback?.overallScore || 0), 0) / allInterviews.length
    );
    user.stats.totalSessions = allInterviews.length;
    user.stats.avgScore = avgScore;
    user.stats.practiceHours = parseFloat(
      (allInterviews.reduce((sum, iv) => sum + (iv.durationMinutes || 0), 0) / 60).toFixed(1)
    );
    user.stats.lastSessionDate = new Date();
    await user.save({ validateBeforeSave: false });

    // Send report email
    try {
      await sendInterviewCompleteEmail(user.email, user.name, interview.jobRole, {
        overall: feedback.overallScore,
        confidence: feedback.confidenceScore,
        communication: feedback.communicationScore,
        technical: feedback.technicalScore,
      });
    } catch (e) {
      console.error('Email send failed (non-critical):', e.message);
    }

    res.json({
      success: true,
      message: 'Interview completed! Great job 🎉',
      interview,
    });
  } catch (error) {
    next(error);
  }
};

// ────────────────────────────────────────────
// @route   GET /api/interviews
// @access  Private
// ────────────────────────────────────────────
exports.getInterviews = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
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

// ────────────────────────────────────────────
// @route   GET /api/interviews/:id
// @access  Private
// ────────────────────────────────────────────
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

// ────────────────────────────────────────────
// @route   DELETE /api/interviews/:id
// @access  Private
// ────────────────────────────────────────────
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
