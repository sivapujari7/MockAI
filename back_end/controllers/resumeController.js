const { generateResumeATS } =
require("../services/aiResumeService");
const fs = require("fs");
const pdf = require("pdf-parse");
const mammoth = require("mammoth");

exports.uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No resume uploaded"
      });
    }

    let text = "";

    if (req.file.mimetype === "application/pdf") {
      const data = await pdf(
        fs.readFileSync(req.file.path)
      );

      text = data.text;
    }

    if (
      req.file.mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const result =
        await mammoth.extractRawText({
          path: req.file.path
        });

      text = result.value;
    }
const atsResult =
  await generateResumeATS(text);

return res.json({
  success: true,
  analysis: atsResult
});
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Resume processing failed"
    });
  }
};