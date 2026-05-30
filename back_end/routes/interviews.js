const express = require('express');
const router = express.Router();
const {
  startInterview,
  sendMessage,
  completeInterview,
  getInterviews,
  getInterview,
  deleteInterview,
} = require('../controllers/InterviewController');
const { protect } = require('../middleware/auth');
const { validate, interviewRules } = require('../middleware/validators');

// All routes protected
router.use(protect);

router.post('/start', interviewRules, validate, startInterview);
router.get('/', getInterviews);
router.get('/:id', getInterview);
router.post('/:id/message', sendMessage);
router.post('/:id/complete', completeInterview);
router.delete('/:id', deleteInterview);

module.exports = router;