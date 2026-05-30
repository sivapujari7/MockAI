const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const { generateResumeATS } = require('../services/aiResumeService');

exports.uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No resume uploaded.',
      });
    }

    let text = '';

    if (req.file.mimetype === 'application/pdf' || req.file.originalname.match(/\.pdf$/i)) {
      const data = await pdf(req.file.buffer);
      text = data.text;
    } else if (
      req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      req.file.originalname.match(/\.docx$/i)
    ) {
      const result = await mammoth.extractRawText({ buffer: req.file.buffer });
      text = result.value;
    } else if (req.file.mimetype === 'text/plain' || req.file.originalname.match(/\.txt$/i)) {
      text = req.file.buffer.toString('utf8');
    } else {
      return res.status(400).json({
        success: false,
        message: 'Please upload a PDF, DOCX, or TXT resume.',
      });
    }

    const atsResult = await generateResumeATS(text, req.body.targetRole);

    return res.json({
      success: true,
      analysis: atsResult,
    });
  } catch (err) {
    console.error(err);

    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || 'Resume processing failed.',
    });
  }
};
