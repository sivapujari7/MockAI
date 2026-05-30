const express = require("express");
const multer = require("multer");

const router = express.Router();

const {
  uploadResume
} = require("../controllers/resumeController");

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(
      null,
      Date.now() + "-" + file.originalname
    );
  }
});

const upload = multer({
  storage
});

router.post(
  "/upload",
  upload.single("resume"),
  uploadResume
);

module.exports = router;