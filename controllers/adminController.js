const User = require('../models/user');
const Story = require('../models/story');
const asyncHandler = require('../utils/asyncHandler');

// Lấy danh sách tất cả người dùng (hỗ trợ phân trang)
exports.getAllUsers = asyncHandler(async (req, res, next) => {
    const page = req.query.page * 1 || 1;
    const limit = req.query.limit * 1 || 10;
    const offset = (page - 1) * limit;

    const { count, rows: users } = await User.findAndCountAll({
        attributes: { exclude: ['passwordHash'] },
        order: [['created_at', 'DESC']],
        limit,
        offset,
    });

    res.status(200).json({
        status: 'success',
        results: users.length,
        pagination: {
            totalUsers: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            limit,
        },
        data: {
            users
        }
    });
});

// Cập nhật vai trò của người dùng
exports.updateUserRole = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { role } = req.body;

    // Kiểm tra role hợp lệ
    const validRoles = ['user', 'author', 'manager', 'admin'];
    if (!validRoles.includes(role)) {
        const error = new Error('Vai trò không hợp lệ.');
        error.statusCode = 400;
        return next(error);
    }

    const user = await User.findByPk(id);
    if (!user) {
        const error = new Error('Không tìm thấy người dùng.');
        error.statusCode = 404;
        return next(error);
    }

    // Không cho phép admin tự thay đổi vai trò của chính mình
    if (user.id === req.user.id) {
        const error = new Error('Không thể thay đổi vai trò của chính mình.');
        error.statusCode = 400;
        return next(error);
    }

    // Logic phân quyền cho manager
    if (req.user.role === 'manager') {
        // Manager không thể sửa quyền của admin và manager khác
        if (user.role === 'admin' || user.role === 'manager') {
            const error = new Error('Manager không thể thay đổi vai trò của admin hoặc manager khác.');
            error.statusCode = 403;
            return next(error);
        }
        
        // Manager không thể cấp quyền admin hoặc manager
        if (role === 'admin' || role === 'manager') {
            const error = new Error('Manager không thể cấp quyền admin hoặc manager.');
            error.statusCode = 403;
            return next(error);
        }
    }

    user.role = role;
    await user.save();

    res.status(200).json({
        status: 'success',
        message: 'Cập nhật vai trò thành công.',
        data: {
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                status: user.status,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            }
        }
    });
});

// Cập nhật trạng thái của người dùng (khóa/mở khóa)
exports.updateUserStatus = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { status } = req.body;

    // Kiểm tra status hợp lệ
    const validStatuses = ['active', 'locked'];
    if (!validStatuses.includes(status)) {
        const error = new Error('Trạng thái không hợp lệ.');
        error.statusCode = 400;
        return next(error);
    }

    const user = await User.findByPk(id);
    if (!user) {
        const error = new Error('Không tìm thấy người dùng.');
        error.statusCode = 404;
        return next(error);
    }

    // Không cho phép admin tự khóa tài khoản của chính mình
    if (user.id === req.user.id) {
        const error = new Error('Không thể thay đổi trạng thái của chính mình.');
        error.statusCode = 400;
        return next(error);
    }

    // Logic phân quyền cho manager
    if (req.user.role === 'manager') {
        // Manager không thể khóa admin và manager khác
        if (user.role === 'admin' || user.role === 'manager') {
            const error = new Error('Manager không thể thay đổi trạng thái của admin hoặc manager khác.');
            error.statusCode = 403;
            return next(error);
        }
    }

    user.status = status;
    await user.save();

    res.status(200).json({
        status: 'success',
        message: status === 'locked' ? 'Đã khóa người dùng thành công.' : 'Đã mở khóa người dùng thành công.',
        data: {
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                status: user.status,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            }
        }
    });
});

// Lấy thông tin chi tiết của một người dùng
exports.getUserById = asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    const user = await User.findByPk(id, {
        attributes: { exclude: ['passwordHash'] }
    });

    if (!user) {
        const error = new Error('Không tìm thấy người dùng.');
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

// ==================== QUẢN LÝ DUYỆT TRUYỆN ====================

// Lấy danh sách truyện cần duyệt (pending)
exports.getPendingStories = asyncHandler(async (req, res, next) => {
    const page = req.query.page * 1 || 1;
    const limit = req.query.limit * 1 || 10;
    const offset = (page - 1) * limit;

    const { count, rows: stories } = await Story.findAndCountAll({
        where: { publicationStatus: 'pending' },
        include: [
            {
                model: require('../models/user'),
                as: 'author',
                attributes: ['id', 'username', 'email']
            }
        ],
        order: [['created_at', 'DESC']],
        limit,
        offset,
    });

    res.status(200).json({
        status: 'success',
        results: stories.length,
        pagination: {
            totalStories: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            limit,
        },
        data: {
            stories
        }
    });
});

// Duyệt truyện
exports.approveStory = asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    const story = await Story.findByPk(id);
    if (!story) {
        const error = new Error('Không tìm thấy truyện.');
        error.statusCode = 404;
        return next(error);
    }

    if (story.publicationStatus === 'approved') {
        const error = new Error('Truyện đã được duyệt trước đó.');
        error.statusCode = 400;
        return next(error);
    }

    story.publicationStatus = 'approved';
    await story.save();

    res.status(200).json({
        status: 'success',
        message: 'Duyệt truyện thành công.',
        data: {
            story: {
                id: story.id,
                title: story.title,
                publicationStatus: story.publicationStatus,
                updatedAt: story.updatedAt
            }
        }
    });
});

// Từ chối truyện
exports.rejectStory = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const reason = req.body?.reason; // Lý do từ chối (optional)

    

    const story = await Story.findByPk(id);
    if (!story) {
        const error = new Error('Không tìm thấy truyện.');
        error.statusCode = 404;
        return next(error);
    }

    if (story.publicationStatus === 'rejected') {
        const error = new Error('Truyện đã bị từ chối trước đó.');
        error.statusCode = 400;
        return next(error);
    }

    story.publicationStatus = 'rejected';
    // Có thể thêm trường rejectionReason nếu cần
    await story.save();

    res.status(200).json({
        status: 'success',
        message: 'Từ chối truyện thành công.',
        data: {
            story: {
                id: story.id,
                title: story.title,
                publicationStatus: story.publicationStatus,
                rejectionReason: reason || null,
                updatedAt: story.updatedAt
            }
        }
    });
});

// Ẩn truyện (ẩn khỏi trang chủ nhưng vẫn tồn tại trong database)
exports.hideStory = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const reason = req.body?.reason; // Lý do ẩn (optional)

    const story = await Story.findByPk(id);
    if (!story) {
        const error = new Error('Không tìm thấy truyện.');
        error.statusCode = 404;
        return next(error);
    }

    if (story.publicationStatus === 'hidden') {
        const error = new Error('Truyện đã bị ẩn trước đó.');
        error.statusCode = 400;
        return next(error);
    }

    story.publicationStatus = 'hidden';
    await story.save();

    res.status(200).json({
        status: 'success',
        message: 'Ẩn truyện thành công.',
        data: {
            story: {
                id: story.id,
                title: story.title,
                publicationStatus: story.publicationStatus,
                hideReason: reason || null,
                updatedAt: story.updatedAt
            }
        }
    });
});

// Hiện lại truyện đã ẩn
exports.unhideStory = asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    const story = await Story.findByPk(id);
    if (!story) {
        const error = new Error('Không tìm thấy truyện.');
        error.statusCode = 404;
        return next(error);
    }

    if (story.publicationStatus !== 'hidden') {
        const error = new Error('Truyện không ở trạng thái ẩn.');
        error.statusCode = 400;
        return next(error);
    }

    story.publicationStatus = 'approved';
    await story.save();

    res.status(200).json({
        status: 'success',
        message: 'Hiện lại truyện thành công.',
        data: {
            story: {
                id: story.id,
                title: story.title,
                publicationStatus: story.publicationStatus,
                updatedAt: story.updatedAt
            }
        }
    });
});

// Lấy danh sách tất cả truyện (cho admin xem tổng quan)
exports.getAllStories = asyncHandler(async (req, res, next) => {
    const page = req.query.page * 1 || 1;
    const limit = req.query.limit * 1 || 10;
    const offset = (page - 1) * limit;
    const status = req.query.status; // 'pending', 'approved', 'rejected'

    const whereClause = {};
    if (status) {
        whereClause.publicationStatus = status;
    }

    const { count, rows: stories } = await Story.findAndCountAll({
        where: whereClause,
        include: [
            {
                model: require('../models/user'),
                as: 'author',
                attributes: ['id', 'username', 'email']
            }
        ],
        order: [['created_at', 'DESC']],
        limit,
        offset,
    });

    res.status(200).json({
        status: 'success',
        results: stories.length,
        pagination: {
            totalStories: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            limit,
        },
        data: {
            stories
        }
    });
});

// Lấy thống kê tổng quan cho admin dashboard
exports.getAdminStats = asyncHandler(async (req, res, next) => {
    // Đếm tổng số người dùng
    const totalUsers = await User.count();
    
    // Đếm tổng số truyện
    const totalStories = await Story.count();
    
    // Đếm số truyện theo trạng thái
    const pendingStories = await Story.count({
        where: { publicationStatus: 'pending' }
    });
    
    const approvedStories = await Story.count({
        where: { publicationStatus: 'approved' }
    });
    
    const rejectedStories = await Story.count({
        where: { publicationStatus: 'rejected' }
    });
    
    // Đếm tổng số danh mục (nếu có model Category)
    let totalCategories = 0;
    try {
        const Category = require('../models/category');
        totalCategories = await Category.count();
    } catch (error) {
        // Nếu không có model Category, để mặc định là 0
    }
    
    // Đếm tổng số lượt xem (nếu có model ReadingHistory)
    let totalViews = 0;
    try {
        const ReadingHistory = require('../models/readingHistory');
        totalViews = await ReadingHistory.count();
    } catch (error) {
        // Nếu không có model ReadingHistory, để mặc định là 0
    }
    
    // Đếm tổng số bình luận (nếu có model Comment)
    let totalComments = 0;
    try {
        const Comment = require('../models/comment');
        totalComments = await Comment.count();
    } catch (error) {
        // Nếu không có model Comment, để mặc định là 0
    }

    res.status(200).json({
        status: 'success',
        data: {
            totalUsers,
            totalStories,
            totalCategories,
            pendingStories,
            approvedStories,
            rejectedStories,
            totalViews,
            totalComments
        }
    });
}); 