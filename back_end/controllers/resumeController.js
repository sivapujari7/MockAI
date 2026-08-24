const mammoth = require('mammoth');
const Resume = require('../models/Resume');
const { generateResumeATS } = require('../services/aiResumeService');

exports.uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No resume uploaded.' });
    }

    let text = '';
    const isPdf  = req.file.mimetype === 'application/pdf' || /\.pdf$/i.test(req.file.originalname);
    const isDocx = /wordprocessingml/.test(req.file.mimetype) || /\.docx$/i.test(req.file.originalname);
    const isDoc  = req.file.mimetype === 'application/msword' || /\.doc$/i.test(req.file.originalname);
    const isTxt  = req.file.mimetype === 'text/plain' || /\.txt$/i.test(req.file.originalname);

    if (isPdf) {
      let parser;
      try {
        parser = require('pdf-parse/lib/pdf-parse.js');
      } catch (_) {
        const mod = require('pdf-parse');
        parser = typeof mod === 'function' ? mod : mod.default;
      }

      if (typeof parser !== 'function') {
        return res.status(500).json({
          success: false,
          message: 'PDF parsing unavailable. Please upload a DOCX or TXT file instead.',
        });
      }

      const data = await parser(req.file.buffer);
      text = data.text || '';

    } else if (isDocx) {
      const result = await mammoth.extractRawText({ buffer: req.file.buffer });
      text = result.value || '';

    } else if (isDoc) {
      try {
        const result = await mammoth.extractRawText({ buffer: req.file.buffer });
        text = result.value || '';
      } catch (_) {
        return res.status(400).json({ success: false, message: 'Old .doc format not supported. Please save as .docx or .pdf.' });
      }

    } else if (isTxt) {
      text = req.file.buffer.toString('utf8');

    } else {
      return res.status(400).json({ success: false, message: 'Please upload a PDF, DOCX, or TXT resume.' });
    }

    if (!text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Could not extract text from your resume. Try a different file format.',
      });
    }

    const targetRole = req.body.targetRole || 'Software Engineer';
    const atsResult = await generateResumeATS(text, targetRole);

    // Save resume analysis to database if user is authenticated or guest
    if (req.user && req.user._id) {
      try {
        await Resume.create({
          user: req.user._id,
          filename: req.file.filename || req.file.originalname,
          originalName: req.file.originalname,
          parsedText: text.slice(0, 10000),
          targetRole,
          analysis: {
            atsScore: atsResult.atsScore,
            keywordsFound: atsResult.skillsFound,
            keywordsMissing: atsResult.missingSkills,
            strengthPoints: atsResult.strengths,
            improvementPoints: atsResult.improvements,
            summary: atsResult.summary,
          },
        });
      } catch (dbErr) {
        console.warn('[resumeController] DB save warning:', dbErr.message);
      }
    }

    return res.json({ success: true, analysis: atsResult });

  } catch (err) {
    console.error('[resumeController] Error:', err.message);
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || 'Resume processing failed.',
    });
  }
};