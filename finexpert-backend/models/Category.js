const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');

const Category = sequelize.define('Category', {
    category_id: {
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
    name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
    }
}, {
    tableName: 'categories',
    timestamps: false
});

module.exports = Category;
