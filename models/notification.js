const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notification = sequelize.define('Notification', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    recipientId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'recipient_id',
    },
    actorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'actor_id',
    },
    entityType: {
        type: DataTypes.ENUM('story', 'chapter', 'comment', 'user'),
        allowNull: false,
        field: 'entity_type',
    },
    entityId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'entity_id',
    },
    type: {
        type: DataTypes.STRING(50),
        allowNull: false,
    },
    isRead: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'is_read',
    },
}, {
    tableName: 'notifications',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
});

module.exports = Notification;