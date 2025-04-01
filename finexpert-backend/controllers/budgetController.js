const { PrismaClient } = require('@prisma/client');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const summarizeExpenses = (expenses) => {
    const summary = {};
    expenses.forEach(exp => {
        if (!summary[exp.category]) summary[exp.category] = 0;
        summary[exp.category] += parseFloat(exp.amount);
    });
    return summary;
};

const generateAdvicePrompt = (spendingData, period) => {
    return `Hey there! 😊 I've got some spending data for the last ${period}, and I need some friendly financial advice! 

    **Here’s the spending breakdown:** 
    ${JSON.stringify(spendingData, null, 2)}

    analyze this and provide **engaging, structured financial advice** like a supportive friend? 
   --**dont say lets chat about
    - **Encourage smart budgeting** 💰 
    - **Point out areas of overspending** 🚨 
    - **Suggest practical ways to save** 🛠️ 
    - **Keep it fun, conversational & insightful** 😃
    - **Use emojis to make it engaging** 🎉 
    -**keep it conise

    The response should feel like a friendly money-savvy friend helping me make better choices. Avoid generic tips—base it on my spending trends! 🚀 Thanks!`;
};


exports.setBudget = async (req, res) => {
    try {
        const { total_amount, manual_allocations } = req.body;
        const userId = req.user.user_id;

        if (!total_amount || isNaN(total_amount)) {
            return res.status(400).json({ message: "Invalid or missing budget amount." });
        }

        let allocatedBudget = {};

        if (manual_allocations) {
            allocatedBudget = manual_allocations;
        } else {
            const startDate = new Date();
            startDate.setMonth(startDate.getMonth() - 1);
            
            const expenses = await prisma.expense.findMany({
                where: { user_id: userId, date: { gte: startDate } },
                select: { category: true, amount: true },
            });

            if (expenses.length === 0) {
                return res.status(400).json({ message: "No past expenses found. Cannot auto-allocate budget." });
            }

            let totalSpent = 0;
            const categorySpending = summarizeExpenses(expenses);
            
            for (const category in categorySpending) {
                totalSpent += categorySpending[category];
            }
            
            for (const category in categorySpending) {
                allocatedBudget[category] = ((categorySpending[category] / totalSpent) * total_amount).toFixed(2);
            }
        }

        await prisma.budgets.upsert({
            where: { user_id: userId },
            update: { total_amount, allocated_budget: allocatedBudget },
            create: { user_id: userId, total_amount, allocated_budget: allocatedBudget },
        });

        res.json({ message: "Budget set successfully", allocatedBudget });
    } catch (error) {
        console.error("Budget Setting Error:", error);
        res.status(500).json({ message: "Error setting budget" });
    }
};

exports.checkBudgetAlerts = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const budget = await prisma.budgets.findUnique({ where: { user_id: userId } });

        if (!budget || !budget.allocated_budget) {
            return res.status(400).json({ message: "Budget not set." });
        }

        const allocatedBudget = budget.allocated_budget;
        const alerts = {};
        
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
        
        const expenses = await prisma.expenses.findMany({
            where: { user_id: userId, date: { gte: startDate } },
            select: { category: true, amount: true },
        });
        
        const currentSpending = summarizeExpenses(expenses);

        for (const category in allocatedBudget) {
            const allocated = parseFloat(allocatedBudget[category]);
            const spent = parseFloat(currentSpending[category] || 0);

            if (spent > 0.8 * allocated) {
                alerts[category] = `Warning! You have spent ${spent} out of ${allocated} in ${category}.`;
            }
        }

        res.json({ message: "Budget alerts", alerts });
    } catch (error) {
        console.error("Budget Alerts Error:", error);
        res.status(500).json({ message: "Error checking budget alerts" });
    }
};

exports.getBudgetAdvice = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { period } = req.query;

        let startDate = new Date();
        if (period === 'week') {
            startDate.setDate(startDate.getDate() - 7);
        } else if (period === 'month') {
            startDate.setMonth(startDate.getMonth() - 1);
        } else {
            return res.status(400).json({ message: "Invalid period. Use 'week' or 'month'." });
        }

        const expenses = await prisma.expenses.findMany({
            where: { user_id: userId, date: { gte: startDate } },
            select: { category: true, amount: true },
        });

        const spendingData = summarizeExpenses(expenses);
        const aiPrompt = generateAdvicePrompt(spendingData, period);
        const aiAdvice = await callGeminiAI(aiPrompt);

        res.json({ message: `AI Financial Advice for last ${period}`, advice: aiAdvice });
    } catch (error) {
        console.error("Budget Advice Error:", error);
        res.status(500).json({ message: "Error generating financial advice" });
    }
};

const callGeminiAI = async (prompt) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent({ contents: [{ role: "user", parts: [{ text: prompt }] }] });

        console.log("Gemini API Raw Response:", JSON.stringify(result, null, 2)); // Debugging

        if (!result || !result.response || !result.response.candidates || result.response.candidates.length === 0) {
            return "No AI insights available.";
        }

        // Extract the first candidate response
        const firstCandidate = result.response.candidates[0];

        // Check if it contains text content
        if (firstCandidate && firstCandidate.content && firstCandidate.content.parts) {
            return firstCandidate.content.parts.map(part => part.text).join("\n");
        }

        return "No AI insights available.";
    } catch (error) {
        console.error("Gemini AI Error:", error.response?.data || error.message);
        return "Unable to fetch AI insights at this time.";
    }
};





