const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');

const Expense = sequelize.define('Expense', {
    expense_id: {
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
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    category: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    date: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'expenses',
    timestamps: false
});

module.exports = Expense;
