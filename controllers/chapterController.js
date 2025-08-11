const Chapter = require('../models/chapter');
const Story = require('../models/story'); // Import Story để tăng view
const asyncHandler = require('../utils/asyncHandler');
const { uploadToFirebase } = require('../service/firebaseService');
const { deleteFromFirebase } = require('../service/firebaseService');

exports.checkChapterOwnership = asyncHandler(async (req, res, next) => {
    if (req.user.role === 'admin') {
        return next();
    }

    let storyId;
    
    // Nếu là tạo chương mới (POST request)
    if (req.method === 'POST' && req.body && (req.body.storyId || req.body.story_id)) {
        storyId = req.body.storyId || req.body.story_id;
    } 
    // Nếu là cập nhật/xóa chương đã có (PATCH/DELETE request)
    else if (req.params.id) {
        const chapterId = req.params.id;
        const chapter = await Chapter.findByPk(chapterId);
        if (!chapter) {
            const error = new Error('Không tìm thấy chương.');
            error.statusCode = 404;
            return next(error);
        }
        storyId = chapter.storyId;
    } else {
        const error = new Error('Thiếu thông tin truyện hoặc chương.');
        error.statusCode = 400;
        return next(error);
    }

    // Kiểm tra quyền sở hữu truyện
    const story = await Story.findByPk(storyId);
    if (!story) {
        const error = new Error('Không tìm thấy truyện.');
        error.statusCode = 404;
        return next(error);
    }
    
    if (story.authorId !== req.user.id) {
        const error = new Error('Bạn không có quyền thao tác với chương của truyện này.');
        error.statusCode = 403;
        return next(error);
    }

    next();
});

// Lấy danh sách chương của một truyện (hỗ trợ phân trang)
exports.getChaptersByStory = asyncHandler(async (req, res, next) => {
    const { storyId } = req.params;
    const page = req.query.page * 1 || 1;
    const limit = req.query.limit * 1 || 50; // Mặc định 50 chương/trang
    const offset = (page - 1) * limit;

    const { count, rows: chapters } = await Chapter.findAndCountAll({
        where: { story_id: storyId },
        order: [['chapter_number', 'ASC']],
        limit,
        offset,
        attributes: ['id', ['chapter_number', 'chapterNumber'], 'title', ['created_at', 'createdAt']]
    });

    res.status(200).json({
        status: 'success',
        results: chapters.length,
        pagination: {
            totalChapters: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
        },
        data: {
            chapters
        }
    });
});


// Lấy nội dung chi tiết của một chương
exports.getChapterContent = asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    const chapter = await Chapter.findByPk(id, {
        attributes: ['id', 'storyId', 'chapterNumber', 'title', 'contentType', 'contentUrls']
    });

    if (!chapter) {
        const error = new Error('Không tìm thấy chương này.');
        error.statusCode = 404;
        return next(error);
    }

    let finalContent;

    // Xử lý dựa trên loại nội dung
    if (chapter.contentType === 'TEXT') {
        // Nếu là truyện chữ, fetch nội dung từ URL của file .txt trên Firebase
        try {
            const response = await fetch(chapter.contentUrls);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            finalContent = await response.text();
        } catch (error) {
            console.error("Lỗi khi fetch nội dung text từ Firebase:", error);
            const err = new Error('Không thể tải nội dung chương truyện.');
            err.statusCode = 500;
            return next(err);
        }
    } else {
        // Nếu là truyện tranh, contentUrls đã là một mảng các URL ảnh (do getter trong model)
        finalContent = chapter.contentUrls;
    }

    // Tăng lượt xem cho truyện (không cần chờ đợi kết quả)
    // Chỉ tăng view count nếu có user đăng nhập hoặc IP khác nhau
    const userIdentifier = req.user?.id || req.ip;
    const viewKey = `view_${chapter.storyId}_${userIdentifier}`;
    
    // Sử dụng global cache để tránh tăng view count nhiều lần
    if (!global.viewCache) {
      global.viewCache = new Map();
    }
    
    const lastViewTime = global.viewCache.get(viewKey);
    const now = Date.now();
    
    // Chỉ tăng view count nếu chưa tăng trong 5 phút qua
    if (!lastViewTime || (now - lastViewTime) > 5 * 60 * 1000) {
      Story.increment('view_count', { where: { id: chapter.storyId } });
      global.viewCache.set(viewKey, now);
    }

    res.status(200).json({
        status: 'success',
        data: {
            id: chapter.id,
            storyId: chapter.storyId,
            chapterNumber: chapter.chapterNumber,
            title: chapter.title,
            contentType: chapter.contentType,
            content: finalContent, // Trả về nội dung text hoặc mảng URL ảnh
        }
    });
});


exports.createChapter = asyncHandler(async (req, res, next) => {
    const storyId = req.body.storyId || req.body.story_id;
    const chapterNumber = req.body.chapterNumber;
    const title = req.body.title;
    const contentType = req.body.contentType;
    const authorId = req.user.id;

    // 1. Kiểm tra dữ liệu đầu vào
    if (!storyId || !chapterNumber || !title || !contentType) {
        const error = new Error('Vui lòng cung cấp đầy đủ thông tin chương.');
        error.statusCode = 400;
        return next(error);
    }
    
    // Kiểm tra file chỉ khi là truyện tranh
    if (contentType === 'IMAGES' && (!req.files || !req.files.files || req.files.files.length === 0)) {
        const error = new Error('Vui lòng cung cấp file ảnh cho chương truyện tranh.');
        error.statusCode = 400;
        return next(error);
    }
    
    // Kiểm tra nội dung text khi là truyện chữ
    if (contentType === 'TEXT' && (!req.body.content || req.body.content.trim() === '')) {
        const error = new Error('Vui lòng cung cấp nội dung cho chương truyện chữ.');
        error.statusCode = 400;
        return next(error);
    }

    // 2. Kiểm tra quyền sở hữu truyện
    const story = await Story.findByPk(storyId);
    if (!story) {
        const error = new Error(`Không tìm thấy truyện với ID ${storyId}.`);
        error.statusCode = 404;
        return next(error);
    }
    
    // Kiểm tra xem người dùng có phải là tác giả của truyện không
    if (story.authorId !== authorId && req.user.role !== 'admin') {
        const error = new Error('Bạn không có quyền đăng chương cho truyện này.');
        error.statusCode = 403; // Forbidden
        return next(error);
    }


    let contentUrls;

    // 2. Xử lý nội dung dựa trên loại
    if (contentType === 'TEXT') {
        // Với truyện chữ, tạo file text và upload lên Firebase
        const textContent = req.body.content;
        const destination = `chapters/${storyId}/chapter-${chapterNumber}.txt`;
        contentUrls = await uploadToFirebase(Buffer.from(textContent, 'utf8'), destination, 'text/plain');
    } else if (contentType === 'IMAGES') {
        // Với truyện tranh, upload file ảnh với progress tracking
        console.log(`📚 Bắt đầu upload ${req.files.files.length} ảnh cho chương ${chapterNumber}`);
        
        const uploadPromises = req.files.files.map(async (file, index) => {
            const pageNumber = index + 1;
            const destination = `chapters/${storyId}/chapter-${chapterNumber}/page-${pageNumber}.jpg`;
            
            try {
                console.log(`📤 Uploading page ${pageNumber}/${req.files.files.length}: ${destination}`);
                const result = await uploadToFirebase(file.buffer, destination, file.mimetype);
                console.log(`✅ Uploaded page ${pageNumber}/${req.files.files.length} successfully`);
                return result;
            } catch (error) {
                console.error(`❌ Failed to upload page ${pageNumber}:`, error);
                throw new Error(`Không thể upload trang ${pageNumber}: ${error.message}`);
            }
        });
        
        // Upload tuần tự để tránh quá tải Firebase
        contentUrls = [];
        for (let i = 0; i < uploadPromises.length; i++) {
            try {
                const result = await uploadPromises[i];
                contentUrls.push(result);
                console.log(`📊 Progress: ${i + 1}/${uploadPromises.length} pages uploaded`);
            } catch (error) {
                // Nếu có lỗi, xóa các file đã upload thành công
                if (contentUrls.length > 0) {
                    console.log(`🧹 Cleaning up ${contentUrls.length} uploaded files due to error`);
                    await deleteFromFirebase(contentUrls);
                }
                throw error;
            }
        }
        
        console.log(`🎉 Tất cả ${contentUrls.length} ảnh đã được upload thành công!`);
    } else {
        const error = new Error('Loại nội dung không hợp lệ.');
        error.statusCode = 400;
        return next(error);
    }

    // 3. Tạo bản ghi chương trong database
    const newChapter = await Chapter.create({
        storyId,
        chapterNumber,
        title,
        contentType,
        contentUrls
    });

    // 4. Trả về kết quả
    res.status(201).json({
        status: 'success',
        message: 'Đăng chương mới thành công.',
        data: {
            chapter: newChapter
        }
    });
});

exports.updateChapter = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { title } = req.body;

    const chapter = await Chapter.findByPk(id);
    if (!chapter) {
        const error = new Error('Không tìm thấy chương này.');
        error.statusCode = 404;
        return next(error);
    }

    // Kiểm tra quyền sở hữu chương
    const story = await Story.findByPk(chapter.storyId);
    if (!story) {
        const error = new Error('Không tìm thấy truyện.');
        error.statusCode = 404;
        return next(error);
    }
    
    if (story.authorId !== req.user.id && req.user.role !== 'admin') {
        const error = new Error('Bạn không có quyền thao tác với chương này.');
        error.statusCode = 403;
        return next(error);
    }

    // Cập nhật nội dung nếu có file mới
    if (req.files && req.files.length > 0) {
        // Xóa nội dung cũ trên Firebase
        await deleteFromFirebase(chapter.contentUrls);

        // Upload nội dung mới (logic tương tự createChapter)
        let newContentUrls;
        if (chapter.contentType === 'TEXT') {
            const file = req.files[0];
            const destination = `chapters/${chapter.storyId}/chapter-${chapter.chapterNumber}.txt`;
            newContentUrls = await uploadToFirebase(file.buffer, destination, file.mimetype);
        } else { // IMAGES
            console.log(`📚 Bắt đầu upload ${req.files.length} ảnh mới cho chương ${chapter.chapterNumber}`);
            
            const uploadPromises = req.files.map(async (file, index) => {
                const pageNumber = index + 1;
                const destination = `chapters/${chapter.storyId}/chapter-${chapter.chapterNumber}/page-${pageNumber}.jpg`;
                
                try {
                    console.log(`📤 Uploading new page ${pageNumber}/${req.files.length}: ${destination}`);
                    const result = await uploadToFirebase(file.buffer, destination, file.mimetype);
                    console.log(`✅ Uploaded new page ${pageNumber}/${req.files.length} successfully`);
                    return result;
                } catch (error) {
                    console.error(`❌ Failed to upload new page ${pageNumber}:`, error);
                    throw new Error(`Không thể upload trang ${pageNumber}: ${error.message}`);
                }
            });
            
            // Upload tuần tự để tránh quá tải Firebase
            newContentUrls = [];
            for (let i = 0; i < uploadPromises.length; i++) {
                try {
                    const result = await uploadPromises[i];
                    newContentUrls.push(result);
                    console.log(`📊 Progress: ${i + 1}/${uploadPromises.length} new pages uploaded`);
                } catch (error) {
                    // Nếu có lỗi, xóa các file đã upload thành công
                    if (newContentUrls.length > 0) {
                        console.log(`🧹 Cleaning up ${newContentUrls.length} uploaded files due to error`);
                        await deleteFromFirebase(newContentUrls);
                    }
                    throw error;
                }
            }
            
            console.log(`🎉 Tất cả ${newContentUrls.length} ảnh mới đã được upload thành công!`);
        }
        chapter.contentUrls = newContentUrls;
    }

    // Cập nhật tiêu đề
    if (title) chapter.title = title;

    await chapter.save();

    res.status(200).json({
        status: 'success',
        message: 'Cập nhật chương thành công.',
        data: { chapter }
    });
});

// Xóa chương
exports.deleteChapter = asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    const chapter = await Chapter.findByPk(id);
    if (!chapter) {
        const error = new Error('Không tìm thấy chương này.');
        error.statusCode = 404;
        return next(error);
    }

    // Kiểm tra quyền sở hữu chương
    const story = await Story.findByPk(chapter.storyId);
    if (!story) {
        const error = new Error('Không tìm thấy truyện.');
        error.statusCode = 404;
        return next(error);
    }
    
    if (story.authorId !== req.user.id && req.user.role !== 'admin') {
        const error = new Error('Bạn không có quyền xóa chương này.');
        error.statusCode = 403;
        return next(error);
    }

    // Xóa nội dung trên Firebase
    try {
        await deleteFromFirebase(chapter.contentUrls);
    } catch (error) {
        console.warn('Không thể xóa nội dung trên Firebase:', error);
    }

    // Xóa chương khỏi database
    await chapter.destroy();

    res.status(200).json({
        status: 'success',
        message: 'Xóa chương thành công.'
    });
});