const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['ai', 'user'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const feedbackSchema = new mongoose.Schema({
  confidenceScore: { type: Number, min: 0, max: 100 },
  communicationScore: { type: Number, min: 0, max: 100 },
  technicalScore: { type: Number, min: 0, max: 100 },
  overallScore: { type: Number, min: 0, max: 100 },
  strengths: [String],
  improvements: [String],
  tips: [String],
  summary: { type: String },
});

const interviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    jobRole: {
      type: String,
      required: [true, 'Job role is required'],
      trim: true,
    },
    company: {
      type: String,
      default: 'General',
      trim: true,
    },
    interviewType: {
      type: String,
      enum: ['hr', 'technical', 'system-design', 'behavioral', 'mixed'],
      default: 'mixed',
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'intermediate',
    },
    status: {
      type: String,
      enum: ['in-progress', 'completed', 'abandoned'],
      default: 'in-progress',
    },
    messages: [messageSchema],
    feedback: feedbackSchema,
    durationMinutes: { type: Number, default: 0 },
    questionsAnswered: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Auto-calculate overall score before saving
interviewSchema.pre('save', function (next) {
  if (this.feedback && this.feedback.confidenceScore !== undefined) {
    const { confidenceScore, communicationScore, technicalScore } = this.feedback;
    this.feedback.overallScore = Math.round(
      (confidenceScore + communicationScore + technicalScore) / 3
    );
  }
  next();
});

module.exports = mongoose.model('Interview', interviewSchema);