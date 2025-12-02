const express = require('express');
const router = express.Router();
const budgetController = require('../controllers/budgetController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.post('/set', budgetController.setBudget);
router.get('/get', budgetController.getBudget);
router.get('/alerts', budgetController.checkBudgetAlerts);
router.get('/advice', budgetController.getBudgetAdvice);
router.post('/ai-allocation', budgetController.getAIBudgetAllocation);
router.delete('/delete/:budgetId', budgetController.deleteBudget);

module.exports = router;
 