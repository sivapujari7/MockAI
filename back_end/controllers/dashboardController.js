const Interview = require('../models/interview');
const User = require('../models/User');

// ────────────────────────────────────────────
// @route   GET /api/dashboard
// @access  Private
// ────────────────────────────────────────────
exports.getDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Recent 5 interviews
    const recentInterviews = await Interview.find({ user: userId, status: 'completed' })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('jobRole company interviewType feedback.overallScore createdAt durationMinutes');

    // All completed interviews for analytics
    const allCompleted = await Interview.find({ user: userId, status: 'completed' })
      .select('feedback createdAt interviewType durationMinutes');

    // Weekly scores (last 7 completed sessions)
    const weeklyScores = allCompleted.slice(-7).map((iv) => ({
      date: iv.createdAt,
      score: iv.feedback?.overallScore || 0,
      type: iv.interviewType,
    }));

    // Skill breakdown averages
    const skillBreakdown = {
      confidence: 0,
      communication: 0,
      technical: 0,
    };
    if (allCompleted.length > 0) {
      allCompleted.forEach((iv) => {
        skillBreakdown.confidence += iv.feedback?.confidenceScore || 0;
        skillBreakdown.communication += iv.feedback?.communicationScore || 0;
        skillBreakdown.technical += iv.feedback?.technicalScore || 0;
      });
      Object.keys(skillBreakdown).forEach((k) => {
        skillBreakdown[k] = Math.round(skillBreakdown[k] / allCompleted.length);
      });
    }

    // Interview type distribution
    const typeDistribution = {};
    allCompleted.forEach((iv) => {
      typeDistribution[iv.interviewType] = (typeDistribution[iv.interviewType] || 0) + 1;
    });

    // AI recommendations based on weakest skill
    const weakSkill = Object.entries(skillBreakdown).sort((a, b) => a[1] - b[1])[0]?.[0];
    const recommendations = {
      confidence: [
        'Practice power poses and deep breathing before interviews.',
        'Record yourself answering and review your body language.',
        'Prepare 5 strong stories using the STAR method.',
      ],
      communication: [
        'Structure every answer: Situation → Task → Action → Result.',
        'Practice speaking out loud for 10 minutes daily.',
        'Use transitional phrases to guide the interviewer.',
      ],
      technical: [
        'Solve 2 LeetCode problems daily — focus on medium difficulty.',
        'Study system design concepts: databases, caching, load balancing.',
        'Review core CS fundamentals: algorithms, data structures, OS.',
      ],
    };

    res.json({
      success: true,
      dashboard: {
        stats: req.user.stats,
        recentInterviews,
        weeklyScores,
        skillBreakdown,
        typeDistribution,
        recommendations: recommendations[weakSkill] || recommendations.technical,
        totalInterviews: allCompleted.length,
        inProgress: await Interview.countDocuments({ user: userId, status: 'in-progress' }),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ────────────────────────────────────────────
// @route   GET /api/dashboard/analytics
// @access  Private
// ────────────────────────────────────────────
exports.getAnalytics = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const days = parseInt(req.query.days) || 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const interviews = await Interview.find({
      user: userId,
      status: 'completed',
      createdAt: { $gte: since },
    }).select('feedback createdAt interviewType jobRole durationMinutes');

    // Group by day
    const byDay = {};
    interviews.forEach((iv) => {
      const day = iv.createdAt.toISOString().slice(0, 10);
      if (!byDay[day]) byDay[day] = { count: 0, totalScore: 0 };
      byDay[day].count++;
      byDay[day].totalScore += iv.feedback?.overallScore || 0;
    });

    const dailyData = Object.entries(byDay).map(([date, data]) => ({
      date,
      sessions: data.count,
      avgScore: Math.round(data.totalScore / data.count),
    }));

    res.json({ success: true, analytics: { dailyData, totalInPeriod: interviews.length } });
  } catch (error) {
    next(error);
  }
};