const multer = require('multer');

// Cấu hình multer để lưu file vào bộ nhớ tạm (RAM).
const storage = multer.memoryStorage();

// Middleware này sẽ tìm và xử lý một file duy nhất trong request
// có tên field (key) là 'coverImage'.
const uploadCoverImage = multer({ storage }).single('coverImage');

// Middleware này sẽ tìm và xử lý một file duy nhất trong request
// có tên field (key) là 'file'.
const singleUpload = multer({ storage }).single('file');
// Middleware MỚI để upload nội dung chương
// .array('files') cho phép upload nhiều file có tên field là 'files'
const uploadChapterContent = multer({ storage }).array('files');

// Middleware tùy chỉnh để xử lý cả file upload và form data
const uploadChapterContentWithFormData = (req, res, next) => {
    // Kiểm tra content type
    const contentType = req.headers['content-type'] || '';
    
    if (contentType.includes('application/json')) {
        // Nếu là JSON, không cần xử lý file upload
        return next();
    }
    
    // Nếu là form data, xử lý file upload và form data
    uploadChapterContent(req, res, (err) => {
        if (err) {
            // Nếu có lỗi với file upload, vẫn tiếp tục để xử lý form data
        }
        
        // Đảm bảo req.body có sẵn cho form data
        if (!req.body) {
            req.body = {};
        }
        

        
        // Xử lý các trường form data từ req.body
        // Multer đã tự động parse FormData và đặt vào req.body
        
        // Luôn gọi next() để tiếp tục xử lý
        next();
    });
};

// Middleware mới để xử lý tất cả fields (cả file và form data)
const uploadAny = multer({ storage }).any();

// Middleware tùy chỉnh để đảm bảo req.body được parse đúng
const uploadAnyWithBody = (req, res, next) => {
    // Kiểm tra content type
    const contentType = req.headers['content-type'] || '';
    
    if (contentType.includes('multipart/form-data')) {
        uploadAny(req, res, (err) => {
                    if (err) {
            // Log error for debugging but continue
        }
        
        // Đảm bảo req.body có sẵn
        if (!req.body) {
            req.body = {};
        }
        
        next();
        });
    } else {
        // Nếu không phải multipart, sử dụng express.json()
        next();
    }
};

// Middleware mới để xử lý chỉ form data (không có file)
const uploadFormDataOnly = multer({ storage }).none();

// Middleware tùy chỉnh cho chapter creation
const uploadChapterFormData = (req, res, next) => {
    const contentType = req.headers['content-type'] || '';
    
    if (contentType.includes('multipart/form-data')) {
        // Sử dụng multer để parse form data
        const upload = multer({ storage }).none();
        
        upload(req, res, (err) => {
            if (err) {
                return next(err);
            }
            
            next();
        });
    } else {
        next();
    }
};

// Export middleware để các file route có thể sử dụng.
module.exports = { uploadCoverImage, singleUpload, uploadChapterContent, uploadChapterContentWithFormData, uploadFormDataOnly, uploadAny, uploadAnyWithBody, uploadChapterFormData };