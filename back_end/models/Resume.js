const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    filename: { type: String, required: true },
    originalName: { type: String },
    fileUrl: { type: String },
    parsedText: { type: String },
    analysis: {
      atsScore: { type: Number, min: 0, max: 100 },
      keywordsFound: [String],
      keywordsMissing: [String],
      strengthPoints: [String],
      improvementPoints: [String],
      formattingScore: { type: Number, min: 0, max: 100 },
      readabilityScore: { type: Number, min: 0, max: 100 },
      overallScore: { type: Number, min: 0, max: 100 },
      summary: { type: String },
    },
    targetRole: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Resume', resumeSchema);