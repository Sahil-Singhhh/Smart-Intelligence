const express = require('express');
const router = express.Router();
const { getRevisionPlan, getDailyDirection, getGeneratedTest, suggestConcepts } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.get('/revision-plan', protect, getRevisionPlan);
router.get('/direction', protect, getDailyDirection);
router.get('/generate-test', protect, getGeneratedTest);
// Unprotected utility route for instant concept auto-suggestions
router.get('/suggest-concepts', suggestConcepts);

module.exports = router;
