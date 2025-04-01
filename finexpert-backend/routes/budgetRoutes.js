const express = require('express');
const router = express.Router();
const budgetController = require('../controllers/budgetController');
const authMiddleware = require('../middleware/authMiddleware');


router.post('/set',authMiddleware, budgetController.setBudget);
router.get('/alerts',authMiddleware, budgetController.checkBudgetAlerts);
router.get('/advice', authMiddleware,budgetController.getBudgetAdvice);

module.exports = router;
