const express = require('express');
const uploadController = require('../controllers/uploadController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { singleUpload } = require('../middleware/uploadMiddleware');
const { uploadCoverImage } = require('../middleware/uploadMiddleware');
const router = express.Router();
//note
// Định nghĩa route để upload ảnh bìa
// POST /api/uploads/cover-image
router.post(
    '/cover-image',
    // Lớp 1: Yêu cầu người dùng phải đăng nhập (kiểm tra token)
    protect,
    // Lớp 2: Yêu cầu người dùng phải có vai trò là 'author' hoặc 'admin'
    authorize('author', 'admin'),
    // Lớp 3: Middleware xử lý file upload từ request (tìm field tên 'file')
    singleUpload,
    // Lớp 4: Controller xử lý logic cuối cùng
    uploadController.uploadCoverImage
);

module.exports = router;
