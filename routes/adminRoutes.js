const express = require('express');
const adminController = require('../controllers/adminController');
const { protect, authorize, authorizeAdminOrManager } = require('../middleware/authMiddleware');

const router = express.Router();

// Bảo vệ tất cả các route - chỉ admin và manager mới có thể truy cập
router.use(protect, authorizeAdminOrManager);

// Thống kê tổng quan
router.get('/stats', adminController.getAdminStats);

// Quản lý người dùng
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserById);
router.patch('/users/:id/role', adminController.updateUserRole);
router.patch('/users/:id/status', adminController.updateUserStatus);

// Quản lý duyệt truyện
router.get('/stories', adminController.getAllStories);
router.get('/stories/pending', adminController.getPendingStories);
router.patch('/stories/:id/approve', adminController.approveStory);
router.patch('/stories/:id/reject', adminController.rejectStory);
router.patch('/stories/:id/hide', adminController.hideStory);
router.patch('/stories/:id/unhide', adminController.unhideStory);

module.exports = router; 