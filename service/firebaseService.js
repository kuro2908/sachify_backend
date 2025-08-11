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
      project_id: "webtruyen-library-60e7d",
      private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCr4VimyTkHb1I+\nIafLyKFbYEc/CEwybdJF3ywe4Bv8Xgh5xI4OenKR74XOr7zZS0RQTCOynTTz2I9O\nxVhKIdLdEzIa3fcAxFqVi7QguxsE8GUcuZ5RmEuauuCq6sUaRz8RWwCReEXlmcbv\nIkiOE+PTcKqlplAra0IaqO79ByI9RUXmIZtszzJXH1cb6FOI+qwHWUA1xgGjjG+8\ndWFL1ZK1IPIoF33QGg16BUvBH40N4cOt0pr6Ti95wDDoGDPCuV0PSyacDY0H8lmr\naMtyB7WUmeI+Xoxl9k4tmZzYAR10aLI3FgLRvSygLWU7KxB7EGgkD5JFLOn8rfYH\nLfDctbEJAgMBAAECggEAD+260v4b8GHzK7nfvIVz2q2B/Mfuk8/UqFAF3Tikr08h\nlvNNvO7BFmAttNlZdYPBqXVc640hHqYHpeOpCnm2+nDweEfwv5vyzyAaydu9JciH\nflF/aA1mmEjQUFagfI50vE2EMHcGd0A4jOnO8ofKWcp7rg1LKbLvddwJBd7239mY\nMB9k0wL3EzShxzinL7/GKbFyQ/Nm9nlM8p2PLVQSPa+lV+AUFL9be2lWJ2d56OBG\n2AG/S9sRRokNZYYgLOeq4f0J5yjsWIsxJQ0PwRVIDWsxv/FfSBZY/zJ8E5R2XsHR\n98Ti+LqlcKk63n3JIW6YxLrZsgjS3Ui4QGGbTu+3vwKBgQDdkiDAKiEpypRYeS9J\nITalvYyuhCF6/5bkm86Fx+GSOLVf7y9/XGyAgBGrf05DOT3NGhp9bo6iPf1FAXlr\nXJwpSUe3PqXqtZXnogE2zvmlnKhS2hnoEan7Kha7DMbyLWtw0VopEVhLfAKJPRWS\nSlNz+HCi0fN7RHnQxK8wIpVXZwKBgQDGlpOKtxY5sGd2btwXr9LH6DzRMp2Yidtk\neq9BD3BtPnwtWw0hVq5c6eZovCdDB5JAM6I6A5vCsmEy5l3Mt87ajkXeVprYsnDx\nksjvXAJRWzfhfqYrFekDuiDZkmLIclU2tWIKB6TrdIUUskqIsp1f71yoOIzfko9W\nFi4XF1yeDwKBgQDTFxW2niyMKSDdjU68aDUtAAIYfW98RCaY08uU7tH7waUiqbhh\nqUcBwYGUFqwUJWO4lIbqOzsOXOp/JKFt5IQuXU9CyB/AFZGkZVasxdFXs4E1te36\nh2GfFQEk4U5kiVsT15ADEjBBcfrkjtqPTdpl4SpGJKnIJXu8prWUsU4APwKBgC8O\n+4OBg0jEXqAYARuz1HT+uXqxTdsZv919nQ4DxJZ+mhp9Ww0tZ0ApRSpIe91MbAG+\nupCYzk5Cyvmu0UdzvxbXZAMd7q+vCUiVifv+h6YTwZgz1Nic5oy1jJdCMxpgzYSb\nUtIhoZkSEX8oCLV/7f8Pz5slW2yXZFP4CY/7Pz1NAoGBANtkRhVIbag4e1tEhIJY\nvxFK6VbANscnlVnFWfCaTUqnFCyH4I50TczXo6uA9Xh8ZKWxNRLM8HsxHM7S74pN\nYB8QZ7SpY4886nphACVA0azaPjWiwHJpO8Nbi+T3zwW0SHZ/D0lxqThDwvAYuTeC\ntD97LtuJbQPVTdV2npDZaGTR\n-----END PRIVATE KEY-----\n",
      client_email: "firebase-adminsdk-fbsvc@webtruyen-library-60e7d.iam.gserviceaccount.com",
    };

    // Kiểm tra xem đã có app nào được khởi tạo chưa
    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: "gs://webtruyen-library-60e7d.firebasestorage.app"
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