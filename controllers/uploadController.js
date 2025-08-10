const asyncHandler = require('../utils/asyncHandler');
const { uploadToCloudinary } = require('../service/cloudinaryService');

// Upload ảnh bìa truyện lên Cloudinary
exports.uploadCoverImage = asyncHandler(async (req, res, next) => {
    // req.file được tạo bởi middleware 'singleUpload' của multer
    if (!req.file) {
        const error = new Error('Vui lòng chọn một file để tải lên.');
        error.statusCode = 400;
        return next(error);
    }

    // Gọi service để upload buffer của file lên Cloudinary
    const result = await uploadToCloudinary(req.file.buffer, 'story-covers');

    res.status(201).json({
        status: 'success',
        message: 'Tải ảnh bìa lên thành công.',
        data: {
            url: result.secure_url, // URL an toàn của ảnh
            publicId: result.public_id
        }
    });
});