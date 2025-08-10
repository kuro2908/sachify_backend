const admin = require('firebase-admin');
const { v4: uuidv4 } = require('uuid');

// SDK sẽ tự động tìm credentials từ file JSON nếu bạn đã đặt biến môi trường
// GOOGLE_APPLICATION_CREDENTIALS, hoặc từ các biến môi trường riêng lẻ.
// Cách làm dưới đây ưu tiên các biến môi trường riêng lẻ.
const serviceAccount = {
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET
});

const bucket = admin.storage().bucket();
console.log('✅ Kết nối đến Firebase Admin SDK thành công!');

/**
 * Upload một file buffer lên Cloud Storage for Firebase.
 * @param {Buffer} buffer - Dữ liệu file dưới dạng buffer.
 * @param {string} destination - Đường dẫn lưu file trên Firebase (vd: 'chapters/story1/chapter1.txt').
 * @param {string} contentType - Loại nội dung của file (vd: 'text/plain', 'image/jpeg').
 * @returns {Promise<string>} - URL công khai để truy cập file.
 */
const uploadToFirebase = async (buffer, destination, contentType) => {
  const file = bucket.file(destination);
  const accessToken = uuidv4();

  await file.save(buffer, {
    metadata: {
      contentType: contentType,
      metadata: {
        firebaseStorageDownloadTokens: accessToken
      }
    },
    public: true,
    validation: 'md5'
  });

  const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(destination)}?alt=media&token=${accessToken}`;
  return publicUrl;
};


const deleteFromFirebase = async (paths) => {
    try {
        if (Array.isArray(paths)) {
            // Xóa nhiều file (dùng cho truyện tranh)
            const deletePromises = paths.map(path => {
                const fileName = decodeURIComponent(path.split('/o/')[1].split('?')[0]);
                return bucket.file(fileName).delete();
            });
            await Promise.all(deletePromises);
        } else {
            // Xóa một file (dùng cho truyện chữ)
            const fileName = decodeURIComponent(paths.split('/o/')[1].split('?')[0]);
            await bucket.file(fileName).delete();
        }
    } catch (error) {
        // Bỏ qua lỗi "file not found" vì có thể file đã bị xóa trước đó
        if (error.code !== 404) {
            console.error("Lỗi khi xóa file trên Firebase:", error);
        }
    }
};

module.exports = { uploadToFirebase, deleteFromFirebase };