const ReadingHistory = require('../models/readingHistory');
const Chapter = require('../models/chapter');
const Story = require('../models/story');
const User = require('../models/user');
const asyncHandler = require('../utils/asyncHandler');

// Lưu tiến độ đọc
exports.saveReadingProgress = asyncHandler(async (req, res, next) => {
    
    const { chapterId } = req.params;
    const userId = req.user.id;

    // Kiểm tra chapter có tồn tại không
    const chapter = await Chapter.findByPk(chapterId);
    if (!chapter) {
        const error = new Error('Không tìm thấy chương này.');
        error.statusCode = 404;
        return next(error);
    }

    // Lưu hoặc cập nhật tiến độ đọc
    const [readingHistory, created] = await ReadingHistory.findOrCreate({
        where: { userId, chapterId },
        defaults: {
            userId,
            chapterId,
            lastReadAt: new Date()
        }
    });

    if (!created) {
        // Cập nhật thời gian đọc nếu đã tồn tại
        readingHistory.lastReadAt = new Date();
        await readingHistory.save();
    }

    res.status(200).json({
        status: 'success',
        message: 'Đã lưu tiến độ đọc',
        data: {
            readingHistory
        }
    });
});

// Lấy lịch sử đọc của user
exports.getUserReadingHistory = asyncHandler(async (req, res, next) => {
    const { userId } = req.params;
    const page = req.query.page * 1 || 1;
    const limit = req.query.limit * 1 || 10;
    const offset = (page - 1) * limit;

    // Kiểm tra user có tồn tại không
    const user = await User.findByPk(userId);
    if (!user) {
        const error = new Error('Không tìm thấy người dùng này.');
        error.statusCode = 404;
        return next(error);
    }

    // Lấy lịch sử đọc với thông tin chapter và story
    const { count, rows: readingHistory } = await ReadingHistory.findAndCountAll({
        where: { userId },
        include: [
            {
                model: Chapter,
                as: 'chapter',
                include: [
                                         {
                         model: Story,
                         as: 'story',
                         attributes: ['id', 'title', 'coverImageUrl', 'authorId'],
                         include: [
                             {
                                 model: User,
                                 as: 'author',
                                 attributes: ['id', 'username']
                             }
                         ]
                     }
                ],
                attributes: ['id', 'title', 'chapterNumber', 'contentType']
            }
        ],
        order: [['lastReadAt', 'DESC']],
        limit,
        offset
    });

    res.status(200).json({
        status: 'success',
        results: readingHistory.length,
        pagination: {
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            hasNext: page < Math.ceil(count / limit),
            hasPrev: page > 1
        },
        data: {
            readingHistory: readingHistory.map(item => ({
                id: item.chapterId,
                chapterId: item.chapterId,
                lastReadAt: item.lastReadAt,
                chapter: {
                    id: item.chapter.id,
                    title: item.chapter.title,
                    chapterNumber: item.chapter.chapterNumber,
                    contentType: item.chapter.contentType
                },
                                 story: {
                     id: item.chapter.story.id,
                     title: item.chapter.story.title,
                     coverImage: item.chapter.story.coverImageUrl,
                     author: {
                         id: item.chapter.story.author.id,
                         username: item.chapter.story.author.username
                     }
                 }
            }))
        }
    });
});

// Lấy tiến độ đọc hiện tại của user cho một story
exports.getCurrentReadingProgress = asyncHandler(async (req, res, next) => {
    const { storyId } = req.params;
    const userId = req.user.id;

    // Lấy chapter cuối cùng đã đọc của story này
    const lastReadChapter = await ReadingHistory.findOne({
        where: { userId },
        include: [
            {
                model: Chapter,
                as: 'chapter',
                where: { storyId },
                attributes: ['id', 'title', 'chapterNumber', 'contentType']
            }
        ],
        order: [['lastReadAt', 'DESC']]
    });

    if (!lastReadChapter) {
        return res.status(200).json({
            status: 'success',
            data: {
                hasRead: false,
                lastReadChapter: null
            }
        });
    }

    res.status(200).json({
        status: 'success',
        data: {
            hasRead: true,
            lastReadChapter: {
                id: lastReadChapter.chapter.id,
                title: lastReadChapter.chapter.title,
                chapterNumber: lastReadChapter.chapter.chapterNumber,
                contentType: lastReadChapter.chapter.contentType,
                lastReadAt: lastReadChapter.lastReadAt
            }
        }
    });
});
