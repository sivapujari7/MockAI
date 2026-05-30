const express = require('express');
const multer = require('multer');
const { uploadResume } = require('../controllers/resumeController');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

router.post('/upload', upload.single('resume'), uploadResume);

module.exports = router;
