const { google } = require('googleapis');

// Hàm này sẽ tự động tìm file credentials dựa trên biến môi trường
// GOOGLE_APPLICATION_CREDENTIALS mà bạn đã thiết lập trong file .env
const auth = new google.auth.GoogleAuth({
  scopes: ['https://www.googleapis.com/auth/documents.readonly'],
});

const docs = google.docs({ version: 'v1', auth });

/**
 * Lấy nội dung văn bản từ một file Google Docs.
 * @param {string} documentId - ID của file Google Docs.
 * @returns {Promise<string>} - Nội dung văn bản của tài liệu.
 */
async function getDocumentContent(documentId) {
  try {
    const res = await docs.documents.get({
      documentId,
    });

    let textContent = '';
    // Duyệt qua nội dung của tài liệu để trích xuất văn bản
    res.data.body.content.forEach(element => {
      if (element.paragraph) {
        element.paragraph.elements.forEach(elem => {
          if (elem.textRun) {
            textContent += elem.textRun.content;
          }
        });
      }
    });
    return textContent;
  } catch (error) {
    console.error('Lỗi khi lấy nội dung từ Google Docs:', error);
    throw new Error('Không thể lấy nội dung chương truyện từ Google Docs.');
  }
}

module.exports = { getDocumentContent };