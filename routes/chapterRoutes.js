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
            
            // Xử lý dữ liệu từ req.files và req.body
            if (req.files && req.files.length > 0) {
                // Tạo req.body nếu chưa có
                if (!req.body) {
                    req.body = {};
                }
                
                // Xử lý từng file
                req.files.forEach(file => {
                    if (file.fieldname === 'files') {
                        // Nếu là field 'files', tạo array
                        if (!req.body.files) {
                            req.body.files = [];
                        }
                        req.body.files.push(file);
                    } else {
                        // Nếu là field khác, chuyển buffer thành string
                        req.body[file.fieldname] = file.buffer.toString();
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