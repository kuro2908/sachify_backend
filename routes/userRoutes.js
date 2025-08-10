const express = require('express');
const userController = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware'); // Import middleware

const router = express.Router();

// === CÁC ROUTE CÔNG KHAI (PUBLIC) ===
// Route lấy danh sách bình luận (công khai, không cần đăng nhập)
router.get('/:userId/comments', userController.getProfileComments);
// Route lấy thông tin chi tiết trang cá nhân
router.get('/:userId', userController.getUserProfile);


// === CÁC ROUTE ĐƯỢC BẢO VỆ (PROTECTED) ===
// Tất cả các route dưới đây đều yêu cầu phải đăng nhập
router.use(protect);

// Route để lấy danh sách truyện đã bookmark của người dùng hiện tại
router.get('/me/bookmarks', userController.getBookmarkedStories);

// Route để thêm/xóa bookmark
router.route('/bookmarks/:storyId')
    .post(userController.addBookmark)
    .delete(userController.removeBookmark);

// Route để lấy lịch sử đọc và ghi nhận lịch sử đọc mới
router.route('/me/history')
    .get(userController.getReadingHistory)
    .post(userController.recordReadingHistory);

// Route để follow người dùng và bỏ follow
router.route('/:userId/follow')
    .post(userController.followUser)
    .delete(userController.unfollowUser);

// Route để đăng bình luận trên trang cá nhân
router.post('/:userId/comments', userController.postProfileComment);

// Route để yêu cầu làm tác giả
router.post('/request-author-role', userController.requestAuthorRole);

module.exports = router;
