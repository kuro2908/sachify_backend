const Category = require('../models/category');
const asyncHandler = require('../utils/asyncHandler');

// Lấy danh sách tất cả thể loại
// GET /api/categories
exports.getAllCategories = asyncHandler(async (req, res, next) => {
    const categories = await Category.findAll({
        order: [['name', 'ASC']] // Sắp xếp theo tên A-Z
    });

    res.status(200).json({
        status: 'success',
        results: categories.length,
        data: {
            categories
        }
    });
});

// Tạo thể loại mới
// POST /api/categories
exports.createCategory = asyncHandler(async (req, res, next) => {
    const { name } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!name) {
        const error = new Error('Vui lòng cung cấp tên cho thể loại.');
        error.statusCode = 400;
        return next(error);
    }

    // Tạo slug từ name
    const slug = name.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Loại bỏ ký tự đặc biệt
        .replace(/\s+/g, '-') // Thay thế khoảng trắng bằng dấu gạch ngang
        .replace(/-+/g, '-') // Loại bỏ nhiều dấu gạch ngang liên tiếp
        .trim('-'); // Loại bỏ dấu gạch ngang ở đầu và cuối

    // Kiểm tra slug đã tồn tại chưa
    const existingCategory = await Category.findOne({ where: { slug } });
    if (existingCategory) {
        const error = new Error('Tên thể loại đã tồn tại. Vui lòng chọn tên khác.');
        error.statusCode = 400;
        return next(error);
    }

    const newCategory = await Category.create({
        name,
        slug
    });

    res.status(201).json({
        status: 'success',
        message: 'Tạo thể loại thành công.',
        data: {
            category: newCategory
        }
    });
});

// Cập nhật thể loại
// PATCH /api/categories/:id
exports.updateCategory = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { name } = req.body;

    const category = await Category.findByPk(id);
    if (!category) {
        const error = new Error('Không tìm thấy thể loại.');
        error.statusCode = 404;
        return next(error);
    }

    // Tạo slug mới nếu name thay đổi
    let newSlug = category.slug;
    if (name && name !== category.name) {
        newSlug = name.toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim('-');
    }

    // Kiểm tra slug đã tồn tại chưa (trừ category hiện tại)
    if (newSlug !== category.slug) {
        const existingCategory = await Category.findOne({ where: { slug: newSlug } });
        if (existingCategory) {
            const error = new Error('Tên thể loại đã tồn tại. Vui lòng chọn tên khác.');
            error.statusCode = 400;
            return next(error);
        }
    }

    // Cập nhật các trường
    if (name) category.name = name;
    category.slug = newSlug;

    await category.save();

    res.status(200).json({
        status: 'success',
        message: 'Cập nhật thể loại thành công.',
        data: {
            category
        }
    });
});

// Xóa thể loại
// DELETE /api/categories/:id
exports.deleteCategory = asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    const category = await Category.findByPk(id);
    if (!category) {
        const error = new Error('Không tìm thấy thể loại.');
        error.statusCode = 404;
        return next(error);
    }

    // Xóa tất cả liên kết trong bảng story_categories trước khi xóa category
    const StoryCategory = require('../models/storyCategory');
    await StoryCategory.destroy({
        where: { categoryId: id }
    });

    // Xóa category
    await category.destroy();

    res.status(200).json({
        status: 'success',
        message: 'Xóa thể loại thành công.'
    });
});

// Lấy thể loại theo ID
// GET /api/categories/:id
exports.getCategoryById = asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    const category = await Category.findByPk(id);
    if (!category) {
        const error = new Error('Không tìm thấy thể loại.');
        error.statusCode = 404;
        return next(error);
    }

    res.status(200).json({
        status: 'success',
        data: {
            category
        }
    });
});
