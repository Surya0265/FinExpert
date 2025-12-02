const { GoogleGenerativeAI } = require('@google/generative-ai');
const prisma = require('../prismaClient');
require('dotenv').config();
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

const roundToTwo = (value) => {
    const numeric = (value && typeof value === 'object' && typeof value.toNumber === 'function')
        ? value.toNumber()
        : Number(value);
    if (!Number.isFinite(numeric)) return 0;
    return Math.round(numeric * 100) / 100;
};

const parseJsonBlock = (text) => {
    if (!text || typeof text !== 'string') return null;

    try {
        return JSON.parse(text);
    } catch (error) {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return null;
        try {
            return JSON.parse(jsonMatch[0]);
        } catch (innerError) {
            return null;
        }
    }
};

const allocationSummation = (allocation, categories) => {
    return categories.reduce((sum, category) => sum + roundToTwo(allocation[category] || 0), 0);
};

const normalizeAllocationFromObject = (rawAllocation, categories, totalBudget) => {
    if (!rawAllocation || typeof rawAllocation !== 'object') return null;

    const allocation = {};
    let total = 0;

    categories.forEach((category) => {
        const normalizedKey = category.toLowerCase().replace(/\s+/g, '');
        let candidateValue;

        if (Object.prototype.hasOwnProperty.call(rawAllocation, category)) {
            candidateValue = rawAllocation[category];
        } else {
            const matchedKey = Object.keys(rawAllocation).find((key) => {
                if (typeof key !== 'string') return false;
                return key.toLowerCase().replace(/\s+/g, '') === normalizedKey;
            });
            if (matchedKey) {
                candidateValue = rawAllocation[matchedKey];
            }
        }

        const numericValue = roundToTwo(candidateValue);
        allocation[category] = numericValue < 0 ? 0 : numericValue;
        total += allocation[category];
    });

    if (total <= 0) {
        return null;
    }

    const diff = roundToTwo(totalBudget - total);
    if (Math.abs(diff) >= 0.01) {
        const targetCategory = [...categories].sort((a, b) => allocation[b] - allocation[a])[0] || categories[0];
        if (targetCategory === undefined) {
            return null;
        }

        const adjustedValue = roundToTwo(allocation[targetCategory] + diff);
        if (adjustedValue < 0) {
            return null;
        }
        allocation[targetCategory] = adjustedValue;
    }

    return allocation;
};


exports.setBudget = async (req, res) => {
    try {
        const { total_amount, manual_allocations, budget_name } = req.body;
        const userId = req.user.user_id;

        const numericTotalAmount = Number(total_amount);

        if (!Number.isFinite(numericTotalAmount) || numericTotalAmount <= 0) {
            return res.status(400).json({ message: "Invalid or missing budget amount." });
        }

        const sanitizedBudgetName = typeof budget_name === 'string' ? budget_name.trim() : '';
        const normalizedTotalAmount = roundToTwo(numericTotalAmount);
        let allocatedBudget = {};

        if (manual_allocations) {
            Object.entries(manual_allocations).forEach(([category, value]) => {
                allocatedBudget[category] = roundToTwo(value);
            });
        } else {
            const startDate = new Date();
            startDate.setMonth(startDate.getMonth() - 1);
            
            const expenses = await prisma.expenses.findMany({
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
                allocatedBudget[category] = roundToTwo((categorySpending[category] / totalSpent) * normalizedTotalAmount);
            }
        }

        const existingBudget = await prisma.budgets.findFirst({ where: { user_id: userId } });

        let budgetRecord;
        if (existingBudget) {
            budgetRecord = await prisma.budgets.update({
                where: { budget_id: existingBudget.budget_id },
                data: {
                    total_amount: normalizedTotalAmount,
                    allocated_budget: allocatedBudget,
                    ...(sanitizedBudgetName ? { budget_name: sanitizedBudgetName } : {}),
                }
            });
        } else {
            budgetRecord = await prisma.budgets.create({
                data: {
                    user_id: userId,
                    total_amount: normalizedTotalAmount,
                    allocated_budget: allocatedBudget,
                    ...(sanitizedBudgetName ? { budget_name: sanitizedBudgetName } : {}),
                }
            });
        }

        res.json({
            message: "Budget set successfully",
            allocatedBudget,
            budget_id: budgetRecord.budget_id,
            budget_name: budgetRecord.budget_name || sanitizedBudgetName || 'Budget',
            total_amount: normalizedTotalAmount,
        });
    } catch (error) {
        console.error("Budget Setting Error:", error);
        res.status(500).json({ message: "Error setting budget" });
    }
};

exports.getBudget = async (req, res) => {
    try {
        const userId = req.user.user_id;

        const budgets = await prisma.budgets.findMany({
            where: { user_id: userId },
            orderBy: { budget_id: 'desc' }
        });

        if (!budgets.length) {
            return res.json({ message: 'No budget found', data: null, allBudgets: [] });
        }

        const latestBudget = budgets[0];

        const normalizeBudget = (budget) => {
            const rawAllocations = budget?.allocated_budget || budget?.manual_allocations || {};
            const normalizedAllocations = {};

            Object.entries(rawAllocations || {}).forEach(([category, value]) => {
                normalizedAllocations[category] = roundToTwo(value);
            });

            return {
                ...budget,
                budget_name: budget?.budget_name ?? 'Budget',
                created_at: budget?.created_at ?? null,
                total_amount: roundToTwo(budget?.total_amount ?? 0),
                allocated_budget: normalizedAllocations,
                manual_allocations: normalizedAllocations,
            };
        };

        res.json({
            message: 'Budget fetched successfully',
            data: normalizeBudget(latestBudget),
            allBudgets: budgets.map(normalizeBudget),
        });
    } catch (error) {
        console.error('Get Budget Error:', error);
        res.status(500).json({ message: 'Error fetching budget' });
    }
};

exports.checkBudgetAlerts = async (req, res) => {
    try {
        const userId = req.user.user_id;
        
        // Get the most recent budget for the user
        const budget = await prisma.budgets.findFirst({ 
            where: { user_id: userId },
            orderBy: { budget_id: 'desc' }
        });

        if (!budget || !budget.allocated_budget) {
            return res.status(200).json({ 
                message: "No budget set yet", 
                alerts: [],
                isEmpty: true 
            });
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

exports.getAIBudgetAllocation = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { totalBudget, categories } = req.body;

        const numericBudget = roundToTwo(totalBudget);
        if (!numericBudget || numericBudget <= 0) {
            return res.status(400).json({ message: 'A valid totalBudget greater than zero is required.' });
        }

        if (!Array.isArray(categories) || categories.length === 0) {
            return res.status(400).json({ message: 'At least one category is required for AI allocation.' });
        }

        const sanitizedCategories = categories
            .map((category) => (typeof category === 'string' ? category.trim() : ''))
            .filter((category) => category.length > 0);

        if (sanitizedCategories.length === 0) {
            return res.status(400).json({ message: 'Provided categories are invalid.' });
        }

        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 3);

        const expenses = await prisma.expenses.findMany({
            where: { user_id: userId, date: { gte: startDate } },
            select: { category: true, amount: true },
        });

        const spendingSummary = summarizeExpenses(expenses);

        const prompt = `You are a sharp financial planning assistant. Allocate a budget of ₹${numericBudget.toFixed(2)} across these categories: ${JSON.stringify(sanitizedCategories)}.
User's recent three-month spending summary (₹): ${JSON.stringify(spendingSummary)}.
Return only valid JSON in the format { "allocation": { "Category": amount } } with amounts summing exactly to ${numericBudget.toFixed(2)} and each amount having two decimals. No additional text.`;

        let aiResponse;
        try {
            aiResponse = await callGeminiAI(prompt);
        } catch (aiError) {
            console.error('Gemini AI Allocation Error:', aiError);
            return res.status(502).json({ message: 'AI allocation service is currently unavailable.' });
        }

        if (!aiResponse) {
            return res.status(502).json({ message: 'AI did not return an allocation.' });
        }

        const parsed = parseJsonBlock(aiResponse);
        const candidateAllocation = parsed && (parsed.allocation || parsed);
        const allocation = normalizeAllocationFromObject(candidateAllocation, sanitizedCategories, numericBudget);

        if (!allocation) {
            return res.status(502).json({ message: 'Received an invalid allocation from AI.' });
        }

        // Final guard to ensure totals match after rounding adjustments
        const totalAllocated = allocationSummation(allocation, sanitizedCategories);
        const diff = roundToTwo(numericBudget - totalAllocated);
        if (Math.abs(diff) >= 0.01) {
            const targetCategory = sanitizedCategories[0];
            allocation[targetCategory] = roundToTwo((allocation[targetCategory] || 0) + diff);
        }

        res.json({
            message: 'AI allocation generated successfully',
            allocation,
            metadata: {
                expensesReviewed: expenses.length,
            },
        });
    } catch (error) {
        console.error('AI Allocation Error:', error);
        res.status(500).json({ message: 'Error generating AI allocation' });
    }
};

exports.deleteBudget = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { budgetId } = req.params;

        if (!budgetId) {
            return res.status(400).json({ message: 'Budget ID is required.' });
        }

        const deleteResult = await prisma.budgets.deleteMany({
            where: {
                budget_id: budgetId,
                user_id: userId,
            },
        });

        if (deleteResult.count === 0) {
            return res.status(404).json({ message: 'Budget not found.' });
        }

        res.json({ message: 'Budget deleted successfully.' });
    } catch (error) {
        console.error('Delete Budget Error:', error);
        res.status(500).json({ message: 'Error deleting budget' });
    }
};

const callGeminiAI = async (prompt) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
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





