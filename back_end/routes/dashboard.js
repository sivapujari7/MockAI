const express = require('express');
const router = express.Router();
const { getDashboard, getAnalytics } = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', getDashboard);
router.get('/analytics', getAnalytics);

module.exports = router;