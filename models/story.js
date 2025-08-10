const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Story = sequelize.define('Story', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    authorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'author_id',
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
    },
    coverImageUrl: {
        type: DataTypes.STRING,
        field: 'cover_image_url',
    },
    status: {
        type: DataTypes.ENUM('ongoing', 'completed', 'hiatus'),
        allowNull: false,
        defaultValue: 'ongoing',
    },
    publicationStatus: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected', 'hidden'),
        allowNull: false,
        defaultValue: 'pending',
        field: 'publication_status',
    },
    viewCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'view_count',
    },
}, {
    tableName: 'stories',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
});

module.exports = Story;
