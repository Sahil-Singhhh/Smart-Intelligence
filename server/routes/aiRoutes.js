const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 15 * 1024 * 1024 } // 15MB limit
});

const {
    getRevisionPlan,
    getDailyDirection,
    getGeneratedTest,
    generateTestFromPdf,
    suggestConcepts
} = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.get('/revision-plan', protect, getRevisionPlan);
router.get('/direction', protect, getDailyDirection);
router.get('/generate-test', protect, getGeneratedTest);
router.post('/generate-test-from-pdf', protect, upload.single('pdfFile'), generateTestFromPdf);
// Unprotected utility route for instant concept auto-suggestions
router.get('/suggest-concepts', suggestConcepts);

module.exports = router;
