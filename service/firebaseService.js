const admin = require('firebase-admin');
const { v4: uuidv4 } = require('uuid');

let bucket = null;
let isInitialized = false;

// Lazy initialization function
const initializeFirebase = () => {
  if (isInitialized) return bucket;
  
  try {
    // Kiểm tra biến môi trường trước khi khởi tạo
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_PRIVATE_KEY || 
        !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_STORAGE_BUCKET) {
      console.warn('⚠️ Firebase environment variables not set, Firebase service will be disabled');
      return null;
    }

    const serviceAccount = {
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
    };

    // Kiểm tra xem đã có app nào được khởi tạo chưa
    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET
      });
    }

    bucket = admin.storage().bucket();
    isInitialized = true;
    console.log('✅ Kết nối đến Firebase Admin SDK thành công!');
    return bucket;
  } catch (error) {
    console.error('❌ Lỗi khởi tạo Firebase:', error);
    return null;
  }
};

/**
 * Upload một file buffer lên Cloud Storage for Firebase.
 * @param {Buffer} buffer - Dữ liệu file dưới dạng buffer.
 * @param {string} destination - Đường dẫn lưu file trên Firebase (vd: 'chapters/story1/chapter1.txt').
 * @param {string} contentType - Loại nội dung của file (vd: 'text/plain', 'image/jpeg').
 * @returns {Promise<string>} - URL công khai để truy cập file.
 */
const uploadToFirebase = async (buffer, destination, contentType) => {
  const firebaseBucket = initializeFirebase();
  if (!firebaseBucket) {
    throw new Error('Firebase service is not available. Please check environment variables.');
  }

  const file = firebaseBucket.file(destination);
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

  const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${firebaseBucket.name}/o/${encodeURIComponent(destination)}?alt=media&token=${accessToken}`;
  return publicUrl;
};

const deleteFromFirebase = async (paths) => {
    try {
        const firebaseBucket = initializeFirebase();
        if (!firebaseBucket) {
            console.warn('⚠️ Firebase service not available, skipping file deletion');
            return;
        }

        if (Array.isArray(paths)) {
            // Xóa nhiều file (dùng cho truyện tranh)
            const deletePromises = paths.map(path => {
                const fileName = decodeURIComponent(path.split('/o/')[1].split('?')[0]);
                return firebaseBucket.file(fileName).delete();
            });
            await Promise.all(deletePromises);
        } else {
            // Xóa một file (dùng cho truyện chữ)
            const fileName = decodeURIComponent(paths.split('/o/')[1].split('?')[0]);
            await firebaseBucket.file(fileName).delete();
        }
    } catch (error) {
        // Bỏ qua lỗi "file not found" vì có thể file đã bị xóa trước đó
        if (error.code !== 404) {
            console.error("Lỗi khi xóa file trên Firebase:", error);
        }
    }
};

module.exports = { uploadToFirebase, deleteFromFirebase };