const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});
console.log('✅ Kết nối đến Cloudinary SDK thành công!');

/**
 * Upload một file buffer lên Cloudinary.
 * @param {Buffer} buffer - Dữ liệu file dưới dạng buffer.
 * @param {string} folder - Thư mục trên Cloudinary để lưu file (vd: 'covers').
 * @returns {Promise<object>} - Kết quả trả về từ Cloudinary, chứa URL và các thông tin khác.
 */
const uploadToCloudinary = (buffer, folder) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { folder: folder },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );
        streamifier.createReadStream(buffer).pipe(uploadStream);
    });
};

const deleteFromCloudinary = async (publicId) => {
    try {
        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        console.error("Lỗi khi xóa file trên Cloudinary:", error);
        // Không ném lỗi để không làm gián đoạn luồng chính, chỉ ghi log
    }
};

module.exports = { uploadToCloudinary, deleteFromCloudinary };