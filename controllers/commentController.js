const Comment = require('../models/comment');
const User = require('../models/user');
const asyncHandler = require('../utils/asyncHandler');

// Đăng một bình luận mới vào chương truyện
// POST /api/comments/chapter/:chapterId
exports.postComment = asyncHandler(async (req, res, next) => {
    const { chapterId } = req.params;
    const userId = req.user.id; // Lấy từ middleware 'protect'
    const { content, parentCommentId } = req.body;

    if (!content) {
        const error = new Error('Nội dung bình luận không được để trống.');
        error.statusCode = 400;
        return next(error);
    }

    const newComment = await Comment.create({
        chapterId: chapterId,
        userId: userId,
        content: content,
        parentCommentId: parentCommentId || null // Nếu không có parentId thì là null
    });

    // Lấy lại bình luận vừa tạo kèm thông tin người dùng để trả về
    const comment = await Comment.findByPk(newComment.id, {
        include: {
            model: User,
            as: 'user',
            attributes: ['id', 'username']
        }
    });

    res.status(201).json({
        status: 'success',
        message: 'Bình luận của bạn đã được gửi.',
        data: {
            comment
        }
    });
});

// Lấy tất cả bình luận của một chương (bao gồm cả trả lời lồng nhau)
// GET /api/comments/chapter/:chapterId
exports.getCommentsByChapter = asyncHandler(async (req, res, next) => {
    const { chapterId } = req.params;

    const comments = await Comment.findAll({
        where: { chapter_id: chapterId },
        include: {
            model: User,
            as: 'user',
            attributes: ['id', 'username']
        },
        order: [['created_at', 'ASC']] // Sắp xếp theo thời gian cũ nhất trước
    });

    // Xây dựng cây bình luận
    const commentMap = {};
    const rootComments = [];

    // Đưa tất cả bình luận vào một map để dễ truy cập
    comments.forEach(comment => {
        commentMap[comment.id] = comment.toJSON();
        commentMap[comment.id].replies = [];
    });

    // Lặp lại để xây dựng cây
    for (const commentId in commentMap) {
        const comment = commentMap[commentId];
        if (comment.parentCommentId) {
            // Nếu là bình luận trả lời, thêm nó vào mảng 'replies' của bình luận cha
            if (commentMap[comment.parentCommentId]) {
                commentMap[comment.parentCommentId].replies.push(comment);
            }
        } else {
            // Nếu là bình luận gốc, thêm vào mảng rootComments
            rootComments.push(comment);
        }
    }

    res.status(200).json({
        status: 'success',
        results: rootComments.length,
        data: {
            comments: rootComments
        }
    });
});