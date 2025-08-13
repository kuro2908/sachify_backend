const { literal } = require('sequelize');
const Bookmark = require('../models/bookmark');
const Story = require('../models/story');
const User = require('../models/user');
const Chapter = require('../models/chapter'); // Import Chapter
const Category = require('../models/category'); // Import Category
const ReadingHistory = require('../models/readingHistory'); // Import ReadingHistory
const UserFollow = require('../models/userFollow');
const ProfileComment = require('../models/profileComment');
const Review = require('../models/review'); // Import Review
const asyncHandler = require('../utils/asyncHandler');

exports.addBookmark = asyncHandler(async (req, res, next) => {
    const storyId = req.params.storyId;
    const userId = req.user.id; // Lấy từ middleware 'protect'

    // SỬA LỖI TẠI ĐÂY: Sử dụng tên thuộc tính camelCase (userId, storyId)
    const [bookmark, created] = await Bookmark.findOrCreate({
        where: { userId: userId, storyId: storyId }
    });

    if (!created) {
        return res.status(409).json({ // 409 Conflict
            status: 'fail',
            message: 'Truyện này đã có trong tủ của bạn.'
        });
    }

    res.status(201).json({
        status: 'success',
        message: 'Đã thêm truyện vào tủ thành công.',
        data: { bookmark }
    });
});

// Xóa một truyện khỏi tủ (bookmark)
// DELETE /api/users/bookmarks/:storyId
exports.removeBookmark = asyncHandler(async (req, res, next) => {
    const storyId = req.params.storyId;
    const userId = req.user.id;

    // SỬA LỖI TẠI ĐÂY: Sử dụng tên thuộc tính camelCase (userId, storyId)
    const result = await Bookmark.destroy({
        where: { userId: userId, storyId: storyId }
    });

    if (result === 0) {
        return res.status(404).json({
            status: 'fail',
            message: 'Không tìm thấy truyện này trong tủ của bạn.'
        });
    }

    res.status(204).json({ // 204 No Content
        status: 'success',
        data: null
    });
});

// Lấy danh sách truyện đã bookmark của người dùng
// GET /api/users/me/bookmarks
exports.getBookmarkedStories = asyncHandler(async (req, res, next) => {
    const userId = req.user.id;

    const userWithBookmarks = await User.findByPk(userId, {
        include: {
            model: Story,
            as: 'bookmarkedStories',
            attributes: [
                'id', 
                'title', 
                'description',
                'cover_image_url', 
                'status',
                'view_count',
                'created_at',
                'updated_at'
            ],
            include: [
                {
                    model: User,
                    as: 'author',
                    attributes: ['id', 'username', 'email']
                },
                {
                    model: Chapter,
                    as: 'chapters',
                    attributes: ['id', 'title', 'chapter_number'],
                    order: [['chapter_number', 'ASC']]
                },
                {
                    model: Category,
                    as: 'categories',
                    attributes: ['id', 'name'],
                    through: { attributes: [] }
                }
            ],
            through: { attributes: [] } // Không lấy thông tin từ bảng trung gian
        }
    });

    res.status(200).json({
        status: 'success',
        results: userWithBookmarks.bookmarkedStories.length,
        data: {
            stories: userWithBookmarks.bookmarkedStories
        }
    });
});

exports.recordReadingHistory = asyncHandler(async (req, res, next) => {
    const { chapterId } = req.body;
    const userId = req.user.id;

    if (!chapterId) {
        const error = new Error('Vui lòng cung cấp chapterId.');
        error.statusCode = 400;
        return next(error);
    }

    // Upsert sẽ tạo mới nếu chưa có, hoặc cập nhật nếu đã tồn tại.
    // Hoàn hảo cho việc cập nhật 'last_read_at' mỗi khi người dùng đọc lại.
    await ReadingHistory.upsert({
        userId: userId,
        chapterId: chapterId,
    });

    res.status(200).json({
        status: 'success',
        message: 'Đã ghi nhận lịch sử đọc.'
    });
});

// Lấy danh sách lịch sử đọc của người dùng
// GET /api/users/me/history
exports.getReadingHistory = asyncHandler(async (req, res, next) => {
    const userId = req.user.id;

    const history = await ReadingHistory.findAll({
        where: { userId: userId },
        order: [['last_read_at', 'DESC']],
        limit: 50, // Giới hạn 50 chương đọc gần nhất
        include: {
            model: Chapter,
            as: 'chapter', // Cần định nghĩa mối quan hệ này trong association.js
            attributes: ['id', 'title', 'chapterNumber'],
            include: {
                model: Story,
                as: 'story', // Cần định nghĩa mối quan hệ này
                attributes: ['id', 'title', 'cover_image_url']
            }
        }
    });

    res.status(200).json({
        status: 'success',
        results: history.length,
        data: {
            history
        }
    });
});

exports.followUser = asyncHandler(async (req, res, next) => {
    const followingId = req.params.userId; // ID của người muốn theo dõi
    const followerId = req.user.id;      // ID của người thực hiện hành động (lấy từ token)

    // Không cho phép người dùng tự theo dõi chính mình
    if (Number(followingId) === followerId) {
        const error = new Error('Bạn không thể tự theo dõi chính mình.');
        error.statusCode = 400;
        return next(error);
    }

    // findOrCreate để tránh tạo bản ghi trùng lặp
    const [follow, created] = await UserFollow.findOrCreate({
        where: {
            followerId: followerId,
            followingId: followingId
        }
    });

    if (!created) {
        return res.status(409).json({ // 409 Conflict
            status: 'fail',
            message: 'Bạn đã theo dõi người dùng này.'
        });
    }

    res.status(201).json({
        status: 'success',
        message: 'Đã theo dõi người dùng thành công.'
    });
});

// Bỏ theo dõi một người dùng
// DELETE /api/users/:userId/follow
exports.unfollowUser = asyncHandler(async (req, res, next) => {
    const followingId = req.params.userId; // ID của người muốn bỏ theo dõi
    const followerId = req.user.id;      // ID của người thực hiện hành động

    const result = await UserFollow.destroy({
        where: {
            followerId: followerId,
            followingId: followingId
        }
    });

    if (result === 0) {
        return res.status(404).json({
            status: 'fail',
            message: 'Bạn chưa theo dõi người dùng này.'
        });
    }

    res.status(204).json({ // 204 No Content
        status: 'success',
        data: null
    });
});

exports.postProfileComment = asyncHandler(async (req, res, next) => {
    const profileUserId = req.params.userId; // ID của chủ nhân trang cá nhân
    const commenterId = req.user.id;         // ID của người viết bình luận
    const { content, parentCommentId } = req.body;

    if (!content) {
        const error = new Error('Nội dung bình luận không được để trống.');
        error.statusCode = 400;
        return next(error);
    }

    const newComment = await ProfileComment.create({
        profileUserId: profileUserId,
        commenterId: commenterId,
        content: content,
        parentCommentId: parentCommentId || null
    });

    // Lấy lại bình luận vừa tạo kèm thông tin người dùng để trả về
    const comment = await ProfileComment.findByPk(newComment.id, {
        include: {
            model: User,
            as: 'commenter', // Alias này phải khớp với định nghĩa trong association.js
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

// Lấy danh sách bình luận trên trang cá nhân
// GET /api/users/:userId/comments
exports.getProfileComments = asyncHandler(async (req, res, next) => {
    const profileUserId = req.params.userId;

    const comments = await ProfileComment.findAll({
        where: { profile_user_id: profileUserId },
        include: {
            model: User,
            as: 'commenter',
            attributes: ['id', 'username']
        },
        order: [['created_at', 'ASC']]
    });

    // Xây dựng cây bình luận (tương tự bình luận chương)
    const commentMap = {};
    const rootComments = [];

    comments.forEach(comment => {
        commentMap[comment.id] = comment.toJSON();
        commentMap[comment.id].replies = [];
    });

    for (const commentId in commentMap) {
        const comment = commentMap[commentId];
        if (comment.parentCommentId) {
            if (commentMap[comment.parentCommentId]) {
                commentMap[comment.parentCommentId].replies.push(comment);
            }
        } else {
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

exports.getUserProfile = asyncHandler(async (req, res, next) => {
    const { userId } = req.params;

    // Sử dụng sequelize.literal để tạo các truy vấn con (subquery) hiệu quả
    const user = await User.findByPk(userId, {
        attributes: [
            'id',
            'username',
            'role',
            'created_at',
            [literal(`(SELECT COUNT(*) FROM user_follows WHERE following_id = ${userId})`), 'followerCount'],
            [literal(`(SELECT COUNT(*) FROM user_follows WHERE follower_id = ${userId})`), 'followingCount'],
            [literal(`(SELECT SUM(view_count) FROM stories WHERE author_id = ${userId})`), 'totalViews'],
            [literal(`(SELECT COUNT(*) FROM stories WHERE author_id = ${userId} AND publication_status = 'approved')`), 'storyCount']
        ],
        include: [
            {
                model: Story,
                as: 'stories',
                where: { publication_status: 'approved' },
                attributes: ['id', 'title', 'cover_image_url', 'status', 'view_count', 'updated_at'],
                required: false // Dùng LEFT JOIN để user không có truyện vẫn hiển thị
            }
        ]
    });

    if (!user) {
        const error = new Error('Không tìm thấy người dùng này.');
        error.statusCode = 404;
        return next(error);
    }

    res.status(200).json({
        status: 'success',
        data: {
            user
        }
    });
});

// Lấy danh sách tất cả người dùng có vai trò là 'author'
// GET /api/authors
exports.getAllAuthors = asyncHandler(async (req, res, next) => {
    // Debug: Kiểm tra tất cả users
    const allUsers = await User.findAll({
        attributes: ['id', 'username', 'role']
    });
    
    
    // Lấy tất cả users có truyện đã được approved
    const authors = await User.findAll({
        attributes: [
            'id',
            'username',
            // Thêm một truy vấn con để đếm số lượng truyện của mỗi tác giả
            [literal(`(SELECT COUNT(*) FROM stories WHERE stories.author_id = User.id AND stories.publication_status = 'approved')`), 'storyCount']
        ],
        where: literal(`(SELECT COUNT(*) FROM stories WHERE stories.author_id = User.id AND stories.publication_status = 'approved') > 0`),
        order: [['username', 'ASC']] // Sắp xếp theo tên A-Z
    });
    
    

    res.status(200).json({
        status: 'success',
        results: authors.length,
        data: {
            authors
        }
    });
});

// Yêu cầu làm tác giả
// POST /api/users/request-author-role
exports.requestAuthorRole = asyncHandler(async (req, res, next) => {
    const userId = req.user.id;

    // Kiểm tra user hiện tại
    const user = await User.findByPk(userId);
    if (!user) {
        const error = new Error('Không tìm thấy người dùng.');
        error.statusCode = 404;
        return next(error);
    }

    // Kiểm tra user đã có quyền tác giả chưa
    if (user.role === 'author' || user.role === 'admin' || user.role === 'manager') {
        return res.status(400).json({
            status: 'fail',
            message: 'Bạn đã có quyền tác giả hoặc quyền cao hơn.'
        });
    }

    // Kiểm tra user đã gửi yêu cầu chưa
    if (user.authorRequest) {
        return res.status(400).json({
            status: 'fail',
            message: 'Bạn đã gửi yêu cầu làm tác giả. Vui lòng chờ admin xem xét.'
        });
    }

    // Cập nhật trạng thái yêu cầu làm tác giả
    await user.update({
        authorRequest: true,
        authorRequestDate: new Date()
    });

    res.status(200).json({
        status: 'success',
        message: 'Yêu cầu làm tác giả đã được gửi thành công. Admin sẽ xem xét và phản hồi sớm nhất.',
        data: {
            authorRequest: true,
            authorRequestDate: user.authorRequestDate
        }
    });
});

// Lấy top tác giả có nhiều truyện nhất
// GET /api/users/rankings/most-stories
exports.getTopAuthorsByStoryCount = asyncHandler(async (req, res, next) => {
    const { limit = 10 } = req.query;

    const topAuthors = await User.findAll({
        attributes: [
            'id',
            'username',
            'avatar_url',
            [literal(`(SELECT COUNT(*) FROM stories WHERE stories.author_id = User.id AND stories.publication_status = 'approved')`), 'storyCount']
        ],
        where: literal(`(SELECT COUNT(*) FROM stories WHERE stories.author_id = User.id AND stories.publication_status = 'approved') > 0`),
        order: [[literal('storyCount'), 'DESC']],
        limit: parseInt(limit, 10),
        include: [
            {
                model: Story,
                as: 'stories',
                where: { publication_status: 'approved' },
                attributes: ['id', 'title', 'cover_image_url'],
                required: false
            }
        ]
    });

    res.status(200).json({
        status: 'success',
        results: topAuthors.length,
        data: {
            authors: topAuthors
        }
    });
});

// Lấy top tác giả có tổng rating truyện cao nhất
// GET /api/users/rankings/highest-rating
exports.getTopAuthorsByRating = asyncHandler(async (req, res, next) => {
    const { limit = 10 } = req.query;

    const topAuthors = await User.findAll({
        attributes: [
            'id',
            'username',
            'avatar_url',
            [literal(`(SELECT COUNT(*) FROM stories WHERE stories.author_id = User.id AND stories.publication_status = 'approved')`), 'storyCount'],
            [literal(`(SELECT AVG(r.rating) FROM reviews r INNER JOIN stories s ON r.story_id = s.id WHERE s.author_id = User.id AND s.publication_status = 'approved')`), 'averageRating'],
            [literal(`(SELECT COUNT(*) FROM reviews r INNER JOIN stories s ON r.story_id = s.id WHERE s.author_id = User.id AND s.publication_status = 'approved')`), 'totalReviews']
        ],
        where: literal(`(SELECT COUNT(*) FROM stories WHERE stories.author_id = User.id AND stories.publication_status = 'approved') > 0`),
        order: [[literal('averageRating'), 'DESC']],
        limit: parseInt(limit, 10),
        include: [
            {
                model: Story,
                as: 'stories',
                where: { publication_status: 'approved' },
                attributes: ['id', 'title', 'cover_image_url'],
                required: false
            }
        ]
    });

    // Lọc ra những tác giả có rating (loại bỏ null)
    const filteredAuthors = topAuthors.filter(author => 
        author.dataValues.averageRating !== null && 
        author.dataValues.averageRating > 0
    );

    res.status(200).json({
        status: 'success',
        results: filteredAuthors.length,
        data: {
            authors: filteredAuthors
        }
    });
});