const express = require('express');
const reviewController = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Lấy tất cả đánh giá của một truyện (công khai)
router.get('/:storyId', reviewController.getReviewsForStory);

// Tạo hoặc cập nhật một đánh giá (yêu cầu đăng nhập)
router.post('/:storyId', protect, reviewController.createOrUpdateReview);

module.exports = router;

