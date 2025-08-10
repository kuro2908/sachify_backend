const Review = require('../models/review');
const User = require('../models/user');
const asyncHandler = require('../utils/asyncHandler');

// Tạo hoặc cập nhật một đánh giá cho truyện
// POST /api/reviews/:storyId
exports.createOrUpdateReview = asyncHandler(async (req, res, next) => {
    const { storyId } = req.params;
    const userId = req.user.id; // Lấy từ middleware 'protect'
    const { rating, content } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!rating || rating < 1 || rating > 5) {
        const error = new Error('Vui lòng cung cấp điểm đánh giá hợp lệ từ 1 đến 5.');
        error.statusCode = 400;
        return next(error);
    }

    // Upsert sẽ tạo mới nếu chưa có, hoặc cập nhật nếu đã tồn tại.
    // Hoàn hảo cho việc cho phép người dùng thay đổi đánh giá của mình.
    // Lưu ý: upsert yêu cầu bạn phải có UNIQUE key trên (userId, storyId) trong DB.
    const [review, isCreated] = await Review.upsert({
        storyId: storyId,
        userId: userId,
        rating: rating,
        content: content
    });

    const statusCode = isCreated ? 201 : 200;
    const message = isCreated ? 'Đánh giá của bạn đã được gửi thành công.' : 'Đánh giá của bạn đã được cập nhật.';

    res.status(statusCode).json({
        status: 'success',
        message: message,
        data: {
            review
        }
    });
});

// Lấy tất cả đánh giá của một truyện (hỗ trợ phân trang)
// GET /api/reviews/:storyId
exports.getReviewsForStory = asyncHandler(async (req, res, next) => {
    const { storyId } = req.params;
    const page = req.query.page * 1 || 1;
    const limit = req.query.limit * 1 || 10;
    const offset = (page - 1) * limit;

    const { count, rows: reviews } = await Review.findAndCountAll({
        where: { story_id: storyId },
        order: [['created_at', 'DESC']],
        limit,
        offset,
        include: {
            model: User,
            as: 'user', // Alias này phải khớp với định nghĩa trong association.js
            attributes: ['id', 'username']
        }
    });

    res.status(200).json({
        status: 'success',
        results: reviews.length,
        pagination: {
            totalReviews: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
        },
        data: {
            reviews
        }
    });
});
