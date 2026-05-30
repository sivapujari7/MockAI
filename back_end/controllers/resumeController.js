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
    const isPdf  = req.file.mimetype === 'application/pdf' || req.file.originalname.match(/\.pdf$/i);
    const isDocx = req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                   || req.file.originalname.match(/\.docx$/i);
    const isTxt  = req.file.mimetype === 'text/plain' || req.file.originalname.match(/\.txt$/i);

    if (isPdf) {
      // Works with pdf-parse v1 (require returns the function directly)
      const pdfParse = require('pdf-parse');
      const data = await pdfParse(req.file.buffer);
      text = data.text;
    } else if (isDocx) {
      const result = await mammoth.extractRawText({ buffer: req.file.buffer });
      text = result.value;
    } else if (isTxt) {
      text = req.file.buffer.toString('utf8');
    } else {
      return res.status(400).json({
        success: false,
        message: 'Please upload a PDF, DOCX, or TXT resume.',
      });
    }

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Could not extract text from your resume. Please try a different file.',
      });
    }

    const atsResult = await generateResumeATS(text, req.body.targetRole);

    return res.json({
      success: true,
      analysis: atsResult,
    });
  } catch (err) {
    console.error('Resume upload error:', err);
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || 'Resume processing failed.',
    });
  }
};