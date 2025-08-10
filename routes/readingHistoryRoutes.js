const express = require('express');
const readingHistoryController = require('../controllers/readingHistoryController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Lưu tiến độ đọc khi user đọc chapter
router.post('/chapters/:chapterId/progress', protect, readingHistoryController.saveReadingProgress);

// Lấy lịch sử đọc của user
router.get('/users/:userId/history', readingHistoryController.getUserReadingHistory);

// Lấy tiến độ đọc hiện tại của user cho một story
router.get('/stories/:storyId/progress', protect, readingHistoryController.getCurrentReadingProgress);

module.exports = router;
