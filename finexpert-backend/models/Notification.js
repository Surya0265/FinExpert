const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');

const Notification = sequelize.define('Notification', {
    notification_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: User,
            key: 'user_id'
        },
        onDelete: 'CASCADE'
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    sent_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'notifications',
    timestamps: false
});

module.exports = Notification;
