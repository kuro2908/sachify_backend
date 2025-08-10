const express = require('express');
const storyController = require('../controllers/storyController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { uploadCoverImage } = require('../middleware/uploadMiddleware');

const router = express.Router();

// Route cho chức năng bảng xếp hạng
router.get('/rankings', storyController.getRankings);

// Route cho chức năng tìm kiếm
router.get('/search', storyController.searchStories);

// Route này bây giờ sẽ hoạt động chính xác
router.get('/', storyController.getAllStories);

// Route để lấy thông tin chi tiết một truyện theo ID
router.get('/:id', storyController.getStory);

// Route để lấy danh sách chương của một truyện
router.get('/:id/chapters', storyController.getStoryChapters);

// Route để tăng lượt xem cho một truyện
router.patch('/:id/view', storyController.incrementView);

// === ROUTE TẠO TRUYỆN MỚI ===
router.post(
    '/',
    protect,
    authorize('author', 'admin'),
    uploadCoverImage,
    storyController.createStory
);

router.patch(
    '/:id',
    protect,
    authorize('author', 'admin'),
    uploadCoverImage,
    storyController.checkStoryOwnership,
    storyController.updateStory
);

router.delete(
    '/:id',
    protect,
    authorize('author', 'admin'),
    storyController.checkStoryOwnership,
    storyController.deleteStory
);

module.exports = router;