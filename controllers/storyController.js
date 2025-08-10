const { Op, fn, col } = require('sequelize');
const sequelize = require('../config/database');
const Story = require('../models/story');
const User = require('../models/user');
const Category = require('../models/category');
const Chapter = require('../models/chapter');
const Review = require('../models/review');
const asyncHandler = require('../utils/asyncHandler');
const { uploadToCloudinary } = require('../service/cloudinaryService');
const { deleteFromCloudinary } = require('../service/cloudinaryService');

exports.checkStoryOwnership = asyncHandler(async (req, res, next) => {
    // Bỏ qua nếu người dùng là admin
    if (req.user.role === 'admin') {
        return next();
    }

    const storyId = req.params.id || req.body.storyId;
    const story = await Story.findByPk(storyId);

    if (!story) {
        const error = new Error('Không tìm thấy truyện.');
        error.statusCode = 404;
        return next(error);
    }

    if (story.authorId !== req.user.id) {
        const error = new Error('Bạn không phải là tác giả của truyện này.');
        error.statusCode = 403; // Forbidden
        return next(error);
    }

    next();
});

exports.getAllStories = asyncHandler(async (req, res, next) => {
  
  
  // 1) Lọc (Filtering)
  const filter = {};
  
  // Chỉ filter theo publicationStatus = 'approved' khi KHÔNG có author filter
  // Khi có author filter, trả về tất cả truyện của author đó (bao gồm pending, approved, rejected)
  if (!req.query.author) {
    filter.publicationStatus = 'approved';
  }
  
  if (req.query.status) {
    filter.status = req.query.status;
  }
  
  // Lọc theo tác giả
  if (req.query.author) {
    
    filter.authorId = parseInt(req.query.author);
  }
  
  // Tìm kiếm theo tên truyện
  if (req.query.search) {
    filter.title = {
      [Op.iLike]: `%${req.query.search}%`
    };
  }
  
  

  // 2) Sắp xếp (Sorting) - SỬA LỖI TẠI ĐÂY
  let order = [['updated_at', 'DESC']]; // Mặc định sắp xếp theo tên cột DB
  if (req.query.sort) {
    const [sortField, sortOrder = 'DESC'] = req.query.sort.split(':');
    
    // Ánh xạ từ tên an toàn (camelCase) sang tên cột DB (snake_case)
    const sortMap = {
        viewCount: 'view_count',
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        title: 'title'
    };

    if (sortMap[sortField]) {
        order = [[sortMap[sortField], sortOrder.toUpperCase()]];
    }
  }

  // 3) Phân trang (Pagination)
  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 10;
  const offset = (page - 1) * limit;

  // 4) Tùy chọn Include
  const includeOptions = [
    {
      model: User,
      as: 'author',
      attributes: ['id', 'username']
    },
    {
      model: Category,
      as: 'categories',
      attributes: ['id', 'name', 'slug'],
      through: { attributes: [] }
    }
  ];

  // Nếu có lọc theo thể loại, thêm điều kiện 'where' vào include
  if (req.query.category) {
    includeOptions[1].where = {
      slug: req.query.category
    };
    // required: true đảm bảo chỉ trả về các truyện có thể loại khớp
    includeOptions[1].required = true;
  }

  // 5) Thực thi truy vấn
  const { count, rows: stories } = await Story.findAndCountAll({
    where: filter,
    order,
    limit,
    offset,
    include: includeOptions,
    distinct: true,
  });
  
  

  // 6) Gửi phản hồi
  res.status(200).json({
    status: 'success',
    results: stories.length,
    pagination: {
        totalStories: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
    },
    data: {
      stories
    }
  });
});

exports.getStory = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  // Sử dụng truy vấn con (subquery) để tính toán, tránh lỗi GROUP BY
  const story = await Story.findByPk(id, {
    attributes: {
      include: [
        [
          sequelize.literal(`(SELECT AVG(rating) FROM reviews WHERE reviews.story_id = Story.id)`),
          'averageRating'
        ],
        [
          sequelize.literal(`(SELECT COUNT(*) FROM reviews WHERE reviews.story_id = Story.id)`),
          'reviewCount'
        ]
      ]
    },
    include: [
      {
        model: User,
        as: 'author',
        attributes: ['id', 'username']
      },
      {
        model: Category,
        as: 'categories',
        attributes: ['id', 'name', 'slug'],
        through: { attributes: [] }
      }
    ]
  });

  // Kiểm tra nếu không tìm thấy truyện
  if (!story) {
    const error = new Error('Không tìm thấy truyện với ID này');
    error.statusCode = 404;
    return next(error);
  }

  // Lấy danh sách chương trong một truy vấn riêng biệt để tối ưu
  // SỬA LỖI TẠI ĐÂY: Sử dụng tên cột DB (snake_case)
  const chapters = await Chapter.findAll({
    where: { story_id: id }, // Sửa từ storyId thành story_id
    order: [['chapter_number', 'ASC']], // Sửa từ chapterNumber thành chapter_number
    attributes: ['id', ['chapter_number', 'chapterNumber'], 'title', ['created_at', 'createdAt']] // Ánh xạ lại tên cột
  });

  // Kết hợp kết quả lại
  const storyData = story.get({ plain: true });
  storyData.chapters = chapters;

  res.status(200).json({
    status: 'success',
    data: {
      story: storyData
    }
  });
});

exports.searchStories = asyncHandler(async (req, res, next) => {
    const { q } = req.query; // Lấy từ khóa tìm kiếm từ query param 'q'
    
    // Nếu không có từ khóa, trả về mảng rỗng hoặc thông báo lỗi
    if (!q) {
        return res.status(400).json({
            status: 'fail',
            message: 'Vui lòng cung cấp từ khóa tìm kiếm.'
        });
    }

    const page = req.query.page * 1 || 1;
    const limit = req.query.limit * 1 || 10;
    const offset = (page - 1) * limit;

    // Sử dụng Op.like của Sequelize để tìm kiếm gần đúng (tương tự LIKE '%keyword%')
    const { count, rows: stories } = await Story.findAndCountAll({
        where: {
            publicationStatus: 'approved',
            [Op.or]: [
                { title: { [Op.like]: `%${q}%` } },
                { description: { [Op.like]: `%${q}%` } }
            ]
        },
        limit,
        offset,
        include: [
            {
                model: User,
                as: 'author',
                attributes: ['id', 'username']
            },
            {
                model: Category,
                as: 'categories',
                attributes: ['id', 'name', 'slug'],
                through: { attributes: [] }
            }
        ],
        order: [['updated_at', 'DESC']],
        distinct: true
    });

    res.status(200).json({
        status: 'success',
        results: stories.length,
        pagination: {
            totalStories: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
        },
        data: {
            stories
        }
    });
});

exports.incrementView = asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    // Sử dụng phương thức increment của Sequelize để tăng giá trị một cách an toàn
    // Nó tương đương với câu lệnh SQL: UPDATE stories SET view_count = view_count + 1 WHERE id = ...
    await Story.increment('view_count', { where: { id } });

    // Phản hồi thành công, không cần gửi lại dữ liệu gì
    res.status(204).json({
        status: 'success',
        data: null
    });
});

exports.getRankings = asyncHandler(async (req, res, next) => {
    // Lấy tiêu chí xếp hạng từ query, mặc định là 'view'
    const { type = 'view', limit = 10 } = req.query;

    let order;
    let attributes = { exclude: [] }; // Mặc định không loại trừ cột nào

    // Xây dựng điều kiện sắp xếp dựa trên 'type'
    switch (type) {
        case 'rating':
            // Sắp xếp theo điểm đánh giá trung bình
            // Thêm một thuộc tính ảo 'averageRating' để sắp xếp
            attributes.include = [
                [
                    sequelize.literal(`(SELECT AVG(rating) FROM reviews WHERE reviews.story_id = Story.id)`),
                    'averageRating'
                ]
            ];
            order = [[sequelize.literal('averageRating'), 'DESC']];
            break;
        case 'newest':
            // Sắp xếp theo truyện mới tạo gần đây
            order = [['created_at', 'DESC']];
            break;
        case 'view':
        default:
            // Mặc định sắp xếp theo lượt xem
            order = [['view_count', 'DESC']];
            break;
    }

    const stories = await Story.findAll({
        where: { publication_status: 'approved' },
        order,
        limit: parseInt(limit, 10),
        attributes,
        include: [
            {
                model: User,
                as: 'author',
                attributes: ['id', 'username']
            },
            {
                model: Category,
                as: 'categories',
                attributes: ['name', 'slug'],
                through: { attributes: [] }
            }
        ]
    });

    res.status(200).json({
        status: 'success',
        results: stories.length,
        data: {
            stories
        }
    });
});


exports.createStory = asyncHandler(async (req, res, next) => {
    const { title, description, status, publicationStatus, categoryIds } = req.body;
    const authorId = req.user.id;

    if (!title || !description || !status || !categoryIds) {
        const error = new Error('Vui lòng cung cấp đầy đủ thông tin truyện.');
        error.statusCode = 400;
        return next(error);
    }

    // req.file được tạo bởi middleware 'uploadCoverImage'
    if (!req.file) {
        const error = new Error('Vui lòng cung cấp ảnh bìa cho truyện.');
        error.statusCode = 400;
        return next(error);
    }
    const uploadResult = await uploadToCloudinary(req.file.buffer, 'story-covers');
    const coverImageUrl = uploadResult.secure_url;

    const newStory = await Story.create({
        title,
        description,
        status,
        authorId,
        coverImageUrl,
        publicationStatus: publicationStatus || 'pending' // Sử dụng publicationStatus từ request hoặc mặc định là pending
    });

    try {
        const parsedCategoryIds = JSON.parse(categoryIds);
        if (Array.isArray(parsedCategoryIds) && parsedCategoryIds.length > 0) {
            await newStory.setCategories(parsedCategoryIds);
        }
    } catch (e) {
        console.warn("categoryIds không hợp lệ:", categoryIds);
    }

    res.status(201).json({
        status: 'success',
        message: 'Truyện của bạn đã được gửi và đang chờ duyệt.',
        data: {
            story: newStory
        }
    });
});


exports.updateStory = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { title, description, status, publicationStatus, categoryIds } = req.body;
    const authorId = req.user.id;

    const story = await Story.findByPk(id);
    if (!story) {
        const error = new Error('Không tìm thấy truyện này.');
        error.statusCode = 404;
        return next(error);
    }
    if (story.authorId !== authorId && req.user.role !== 'admin') {
        const error = new Error('Bạn không có quyền chỉnh sửa truyện này.');
        error.statusCode = 403;
        return next(error);
    }

    // Cập nhật ảnh bìa nếu có file mới
    if (req.file) {
        // Xóa ảnh cũ trên Cloudinary
        if (story.coverImageUrl) {
            const publicId = story.coverImageUrl.split('/').pop().split('.')[0];
            await deleteFromCloudinary(`story-covers/${publicId}`);
        }
        // Upload ảnh mới
        const uploadResult = await uploadToCloudinary(req.file.buffer, 'story-covers');
        story.coverImageUrl = uploadResult.secure_url;
    }

    // Cập nhật các thông tin khác
    if (title) story.title = title;
    if (description) story.description = description;
    if (status) story.status = status;
    if (publicationStatus) story.publicationStatus = publicationStatus;
    
    await story.save();

    // Cập nhật thể loại
    if (categoryIds) {
        const parsedCategoryIds = JSON.parse(categoryIds);
        if (Array.isArray(parsedCategoryIds)) {
            await story.setCategories(parsedCategoryIds);
        }
    }

    res.status(200).json({
        status: 'success',
        message: 'Cập nhật truyện thành công.',
        data: { story }
    });
});

exports.deleteStory = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const authorId = req.user.id;

    const story = await Story.findByPk(id);
    if (!story) {
        const error = new Error('Không tìm thấy truyện này.');
        error.statusCode = 404;
        return next(error);
    }
    if (story.authorId !== authorId && req.user.role !== 'admin') {
        const error = new Error('Bạn không có quyền xóa truyện này.');
        error.statusCode = 403;
        return next(error);
    }

    // Xóa ảnh bìa trên Cloudinary nếu có
    if (story.coverImageUrl) {
        try {
            const publicId = story.coverImageUrl.split('/').pop().split('.')[0];
            await deleteFromCloudinary(`story-covers/${publicId}`);
        } catch (error) {
            console.warn('Không thể xóa ảnh bìa trên Cloudinary:', error);
        }
    }

    // Xóa truyện
    await story.destroy();

    res.status(200).json({
        status: 'success',
        message: 'Xóa truyện thành công.'
    });
});

// Lấy danh sách chương của một truyện
exports.getStoryChapters = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    
    // Kiểm tra truyện có tồn tại không
    const story = await Story.findByPk(id);
    if (!story) {
        const error = new Error('Không tìm thấy truyện này.');
        error.statusCode = 404;
        return next(error);
    }

    // Lấy danh sách chương của truyện
    const chapters = await Chapter.findAll({
        where: { storyId: id },
        attributes: [
            'id', 
            'title', 
            'contentUrls', 
            'chapterNumber', 
            'contentType', 
            ['created_at', 'createdAt'], 
            ['updated_at', 'updatedAt']
        ],
        order: [['chapterNumber', 'ASC']]
    });

    res.status(200).json({
        status: 'success',
        results: chapters.length,
        data: {
            chapters
        }
    });
});
