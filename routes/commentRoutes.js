const express = require('express');
const commentController = require('../controllers/commentController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Route để lấy và đăng bình luận cho một chương
router.route('/chapter/:chapterId')
    .post(protect, commentController.postComment) // Đăng bình luận (yêu cầu đăng nhập)
    .get(commentController.getCommentsByChapter);  // Lấy bình luận (công khai)

module.exports = router;
