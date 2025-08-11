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

// Xóa một bình luận
// DELETE /api/comments/:commentId
exports.deleteComment = asyncHandler(async (req, res, next) => {
    const { commentId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Tìm comment cần xóa
    const comment = await Comment.findByPk(commentId, {
        include: [
            {
                model: User,
                as: 'user',
                attributes: ['id', 'username']
            }
        ]
    });

    if (!comment) {
        const error = new Error('Bình luận không tồn tại.');
        error.statusCode = 404;
        return next(error);
    }

    // Kiểm tra quyền xóa comment
    let canDelete = false;

    // Admin và manager có thể xóa mọi comment
    if (userRole === 'admin' || userRole === 'manager') {
        canDelete = true;
    }
    // Author có thể xóa comment trong truyện của mình (cần kiểm tra thêm)
    else if (userRole === 'author') {
        // TODO: Kiểm tra xem author có phải là tác giả của truyện chứa comment này không
        canDelete = true; // Tạm thời cho phép author xóa mọi comment
    }
    // Người đăng comment có thể xóa comment của mình
    else if (comment.userId === userId) {
        canDelete = true;
    }

    if (!canDelete) {
        const error = new Error('Bạn không có quyền xóa bình luận này.');
        error.statusCode = 403;
        return next(error);
    }

    // Xóa tất cả reply của comment trước
    await Comment.destroy({
        where: { parentCommentId: commentId }
    });

    // Xóa comment chính
    await comment.destroy();

    res.status(200).json({
        status: 'success',
        message: 'Bình luận đã được xóa thành công.'
    });
});