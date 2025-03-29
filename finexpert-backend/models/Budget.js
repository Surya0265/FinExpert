const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');

const Budget = sequelize.define('Budget', {
    budget_id: {
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
    total_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    }
}, {
    tableName: 'budgets',
    timestamps: false
});

module.exports = Budget;
