const express = require('express');
const chapterController = require('../controllers/chapterController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { uploadChapterContentWithFormData, uploadFormDataOnly, uploadAny, uploadAnyWithBody, uploadChapterFormData } = require('../middleware/uploadMiddleware')

const router = express.Router();

// Middleware để parse form data - Sửa lỗi "Unexpected field"
const parseFormData = (req, res, next) => {
    if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
        // Sử dụng multer.any() để xử lý tất cả các field một cách linh hoạt
        const multer = require('multer');
        const storage = multer.memoryStorage();
        const upload = multer({ storage }).any(); // Xử lý tất cả fields
        
        upload(req, res, (err) => {
            if (err) {
                console.error('Multer error:', err);
                return next(err);
            }
            
            console.log('Multer processed files:', req.files);
            console.log('Multer processed body:', req.body);
            
            // Xử lý dữ liệu từ req.files và req.body
            if (req.files && req.files.length > 0) {
                // Tạo req.body nếu chưa có
                if (!req.body) {
                    req.body = {};
                }
                
                // Tạo cấu trúc req.files.files cho field 'files'
                const filesField = req.files.filter(file => file.fieldname === 'files');
                if (filesField.length > 0) {
                    req.files.files = filesField;
                }
                
                // Xử lý các field khác (không phải files)
                req.files.forEach(file => {
                    if (file.fieldname !== 'files') {
                        // Chuyển buffer thành string cho các field khác
                        req.body[file.fieldname] = file.buffer.toString();
                    }
                });
                
                console.log('After processing - req.files.files:', req.files.files);
                console.log('After processing - req.body:', req.body);
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