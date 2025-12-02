const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { 
    addExpense, 
    getExpenses, 
    getExpensesByPeriod, 
    getExpensesByCategory, 
    updateExpense, 
    deleteExpense 
} = require('../controllers/expenseController');

const router = express.Router();

router.post('/addexpenses', authMiddleware, addExpense);
router.get('/getexpenses', authMiddleware, getExpenses);
router.get('/category-wise', authMiddleware, getExpensesByCategory); // Fetch expenses for pie chart
router.get('/:period', authMiddleware, getExpensesByPeriod); // Fetch expenses for bar chart
router.put('/:expense_id', authMiddleware, updateExpense);
router.delete('/:expense_id', authMiddleware, deleteExpense);

module.exports = router;
