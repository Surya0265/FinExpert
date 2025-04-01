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
router.get('/expenses/:period', authMiddleware, getExpensesByPeriod); // Fetch expenses for bar chart
router.get('/expenses/category-wise', authMiddleware, getExpensesByCategory); // Fetch expenses for pie chart
router.put('/expenses/:expense_id', authMiddleware, updateExpense);
router.delete('/expenses/:expense_id', authMiddleware, deleteExpense);

module.exports = router;
