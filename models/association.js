const User = require('./user');
const Story = require('./story');
const Chapter = require('./chapter');
const Category = require('./category');
const Review = require('./review');
const Comment = require('./comment');
const Bookmark = require('./bookmark');
const StoryCategory = require('./storyCategory');
const ReadingHistory = require('./readingHistory');
const UserFollow = require('./userFollow');
const ProfileComment = require('./profileComment');
const Notification = require('./notification');

function defineAssociations() {
    // User - Story (One-to-Many)
    User.hasMany(Story, { foreignKey: 'authorId', as: 'stories' });
    Story.belongsTo(User, { foreignKey: 'authorId', as: 'author' });

    // Story - Chapter (One-to-Many)
    Story.hasMany(Chapter, { foreignKey: 'storyId', as: 'chapters' });
    Chapter.belongsTo(Story, { foreignKey: 'storyId', as: 'story' });

    // ReadingHistory - Chapter (One-to-One)
    ReadingHistory.belongsTo(Chapter, { foreignKey: 'chapterId', as: 'chapter' });

    // Story - Review (One-to-Many)
    Story.hasMany(Review, { foreignKey: 'storyId', as: 'reviews' });
    Review.belongsTo(Story, { foreignKey: 'storyId', as: 'story' });

    // User - Review (One-to-Many)
    User.hasMany(Review, { foreignKey: 'userId', as: 'reviews' });
    Review.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    
    // Chapter - Comment (One-to-Many)
    Chapter.hasMany(Comment, { foreignKey: 'chapterId', as: 'comments' });
    Comment.belongsTo(Chapter, { foreignKey: 'chapterId', as: 'chapter' });

    // User - Comment (One-to-Many)
    User.hasMany(Comment, { foreignKey: 'userId', as: 'comments' });
    Comment.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    
    // Comment - Replies (Self-referencing One-to-Many)
    Comment.hasMany(Comment, { as: 'replies', foreignKey: 'parentCommentId' });
    Comment.belongsTo(Comment, { as: 'parent', foreignKey: 'parentCommentId' });

    // Story - Category (Many-to-Many)
    Story.belongsToMany(Category, { through: StoryCategory, foreignKey: 'storyId', as: 'categories' });
    Category.belongsToMany(Story, { through: StoryCategory, foreignKey: 'categoryId', as: 'stories' });

    // User - Story (Bookmarks - Many-to-Many)
    User.belongsToMany(Story, { through: Bookmark, foreignKey: 'userId', as: 'bookmarkedStories' });
    Story.belongsToMany(User, { through: Bookmark, foreignKey: 'storyId', as: 'bookmarkedByUsers' });

    // User - Chapter (Reading History - Many-to-Many)
    User.belongsToMany(Chapter, { through: ReadingHistory, foreignKey: 'userId', as: 'readChapters' });
    Chapter.belongsToMany(User, { through: ReadingHistory, foreignKey: 'chapterId', as: 'readByUsers' });

    // User - User (Follows - Many-to-Many)
    User.belongsToMany(User, { as: 'followers', through: UserFollow, foreignKey: 'followingId' });
    User.belongsToMany(User, { as: 'following', through: UserFollow, foreignKey: 'followerId' });

    // User - ProfileComment (One-to-Many for owner)
    User.hasMany(ProfileComment, { foreignKey: 'profileUserId', as: 'profileComments' });
    ProfileComment.belongsTo(User, { foreignKey: 'profileUserId', as: 'profileOwner' });
    
    // User - ProfileComment (One-to-Many for commenter)
    User.hasMany(ProfileComment, { foreignKey: 'commenterId', as: 'madeProfileComments' });
    ProfileComment.belongsTo(User, { foreignKey: 'commenterId', as: 'commenter' });

    // ProfileComment - Replies (Self-referencing One-to-Many)
    ProfileComment.hasMany(ProfileComment, { as: 'replies', foreignKey: 'parentCommentId' });
    ProfileComment.belongsTo(ProfileComment, { as: 'parent', foreignKey: 'parentCommentId' });
    
    // User - Notification (Recipient)
    User.hasMany(Notification, { foreignKey: 'recipientId', as: 'notifications' });
    Notification.belongsTo(User, { foreignKey: 'recipientId', as: 'recipient' });

    // User - Notification (Actor)
    User.hasMany(Notification, { foreignKey: 'actorId', as: 'sentNotifications' });
    Notification.belongsTo(User, { foreignKey: 'actorId', as: 'actor' });
}

module.exports = { defineAssociations };