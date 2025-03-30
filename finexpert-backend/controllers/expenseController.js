const Expense  = require('../models/Expense');

// Add Expense
exports.addExpense = async (req, res) => {
    try {
        const { amount, category } = req.body;
        const newExpense = await Expense.create({ user_id: req.user.user_id, amount, category });
        res.json(newExpense);
    } catch (error) {
        res.status(500).json({ message: "Error adding expense" });
    }
};

// Get User Expenses
exports.getExpenses = async (req, res) => {
    try {
        const expenses = await Expense.findAll({ where: { user_id: req.user.user_id } });
        res.json(expenses);
    } catch (error) {
        res.status(500).json({ message: "Error fetching expenses" });
    }
};

// Update Expense
exports.updateExpense = async (req, res) => {
    try {
        const { amount, category } = req.body;
        await Expense.update({ amount, category }, { where: { expense_id: req.params.expense_id, user_id: req.user.user_id } });
        res.json({ message: "Expense updated successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error updating expense" });
    }
};

// Delete Expense
exports.deleteExpense = async (req, res) => {
    try {
        await Expense.destroy({ where: { expense_id: req.params.expense_id, user_id: req.user.user_id } });
        res.json({ message: "Expense deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting expense" });
    }
};
