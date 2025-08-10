const express = require('express');
const chapterController = require('../controllers/chapterController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { uploadChapterContentWithFormData, uploadFormDataOnly, uploadAny, uploadAnyWithBody, uploadChapterFormData } = require('../middleware/uploadMiddleware')

const router = express.Router();

// Middleware để parse form data
const parseFormData = (req, res, next) => {
    if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
        // Sử dụng multer để parse multipart form data
        const multer = require('multer');
        const storage = multer.memoryStorage();
        const upload = multer({ storage }).fields([
            { name: 'storyId', maxCount: 1 },
            { name: 'chapterNumber', maxCount: 1 },
            { name: 'title', maxCount: 1 },
            { name: 'contentType', maxCount: 1 },
            { name: 'isPublished', maxCount: 1 },
            { name: 'content', maxCount: 1 },
            { name: 'files', maxCount: 10 }
        ]);
        
        upload(req, res, (err) => {
            if (err) {
                return next(err);
            }
            
            // Nếu req.body đã có dữ liệu, không cần parse thêm
            if (req.body && Object.keys(req.body).length > 0) {
                // Keep existing data
            }
            // Nếu req.body rỗng nhưng req.files có dữ liệu, parse từ req.files
            else if (req.files && Object.keys(req.files).length > 0) {
                req.body = {};
                Object.keys(req.files).forEach(fieldName => {
                    const files = req.files[fieldName];
                    if (files && files.length > 0) {
                        if (fieldName === 'files') {
                            // Giữ nguyên files cho field 'files'
                            req.body[fieldName] = files;
                        } else {
                            // Chuyển đổi buffer thành string cho các field khác
                            req.body[fieldName] = files[0].buffer.toString();
                        }
                    }
                });
            }
            
            next();
        });
    } else {
        next();
    }
};

// Lấy danh sách chương theo storyId
// GET /api/chapters/story/1
router.get('/story/:storyId', chapterController.getChaptersByStory);

// Lấy nội dung chi tiết một chương theo id của chương
// GET /api/chapters/123
router.get('/:id', chapterController.getChapterContent);

// Route để tạo một chương mới
router.post(
    '/',
    protect,
    authorize('author', 'admin'),
    parseFormData, // Middleware parse form data
    chapterController.createChapter
);

router.patch(
    '/:id',
    protect,
    authorize('author', 'admin'),
    uploadChapterContentWithFormData,
    chapterController.updateChapter
);

router.delete(
    '/:id',
    protect,
    authorize('author', 'admin'),
    chapterController.deleteChapter
);

module.exports = router;