const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { addExpense, getExpenses, updateExpense, deleteExpense } = require('../controllers/expenseController');

const router = express.Router();

router.post('/', authMiddleware, addExpense);
router.get('/', authMiddleware, getExpenses);
router.put('/:expense_id', authMiddleware, updateExpense);
router.delete('/:expense_id', authMiddleware, deleteExpense);

module.exports = router;
