const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Add Expense
exports.addExpense = async (req, res) => {
    try {
        const { amount, category } = req.body;
        const newExpense = await prisma.expenses.create({
            data: {
                user_id: req.user.user_id,
                amount: parseFloat(amount),
                category,
                date: new Date(),
            },
        });
        res.json(newExpense);
    } catch (error) {
        console.error("Error adding expense:", error);
        res.status(500).json({ message: "Error adding expense" });
    }
};

// Get User Expenses
exports.getExpenses = async (req, res) => {
    try {
        const expenses = await prisma.expenses.findMany({
            where: { user_id: req.user.user_id },
        });
        res.json(expenses);
    } catch (error) {
        console.error("Error fetching expenses:", error);
        res.status(500).json({ message: "Error fetching expenses" });
    }
};

// Get Expenses by Time Period (For Bar Chart)
exports.getExpensesByPeriod = async (req, res) => {
    try {
        const { period } = req.params; // 'week' or 'month'
        const userId = req.user.user_id;

        let startDate;
        const endDate = new Date(); // Today

        if (period === 'week') {
            startDate = new Date();
            startDate.setDate(startDate.getDate() - 7);
        } else if (period === 'month') {
            startDate = new Date();
            startDate.setMonth(startDate.getMonth() - 1);
        } else {
            return res.status(400).json({ message: 'Invalid period. Use "week" or "month".' });
        }

        const expenses = await prisma.expenses.findMany({
            where: {
                user_id: userId,
                date: { gte: startDate, lte: endDate },
            },
            select: { category: true, amount: true, date: true },
        });

        // Group expenses by date for the Bar Chart
        const groupedExpenses = {};
        expenses.forEach(exp => {
            const dateKey = exp.date.toISOString().split('T')[0]; // Format: YYYY-MM-DD
            groupedExpenses[dateKey] = (groupedExpenses[dateKey] || 0) + parseFloat(exp.amount);
        });

        const chartData = Object.keys(groupedExpenses).map(date => ({
            date,
            amount: groupedExpenses[date],
        }));

        res.json({ message: 'Expenses retrieved successfully', data: chartData });

    } catch (error) {
        console.error("Error fetching expenses by period:", error);
        res.status(500).json({ message: 'Error fetching expenses' });
    }
};

// Get Expenses by Category (For Pie Chart)
exports.getExpensesByCategory = async (req, res) => {
    try {
        const userId = req.user.user_id;

        const expenses = await prisma.expense.findMany({
            where: { user_id: userId },
            select: { category: true, amount: true },
        });

        // Group expenses by category for the Pie Chart
        const categoryExpenses = {};
        expenses.forEach(exp => {
            categoryExpenses[exp.category] = (categoryExpenses[exp.category] || 0) + parseFloat(exp.amount);
        });

        const pieChartData = Object.keys(categoryExpenses).map(category => ({
            category,
            amount: categoryExpenses[category],
        }));

        res.json({ message: 'Expenses by category retrieved successfully', data: pieChartData });

    } catch (error) {
        console.error("Error fetching expenses by category:", error);
        res.status(500).json({ message: 'Error fetching category-wise expenses' });
    }
};

// Update Expense
exports.updateExpense = async (req, res) => {
    try {
        const { amount, category } = req.body;
        await prisma.expenses.updateMany({
            where: { expense_id: parseInt(req.params.expense_id), user_id: req.user.user_id },
            data: { amount: parseFloat(amount), category },
        });

        res.json({ message: "Expense updated successfully" });
    } catch (error) {
        console.error("Error updating expense:", error);
        res.status(500).json({ message: "Error updating expense" });
    }
};

// Delete Expense
exports.deleteExpense = async (req, res) => {
    try {
        await prisma.expenses.deleteMany({
            where: { expense_id: parseInt(req.params.expense_id), user_id: req.user.user_id },
        });

        res.json({ message: "Expense deleted successfully" });
    } catch (error) {
        console.error("Error deleting expense:", error);
        res.status(500).json({ message: "Error deleting expense" });
    }
};
