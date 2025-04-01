const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { PrismaClient } = require('@prisma/client'); // Import Prisma Client
const authRoutes = require('./routes/authRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const budgetRoutes = require('./routes/budgetRoutes');

const app = express();
const prisma = new PrismaClient(); // Initialize Prisma

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/budgets', budgetRoutes);

// Function to start the server
async function startServer() {
    try {
        await prisma.$connect(); // Connect to the database
        console.log('✅ Database connected successfully');

        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`🚀 Server is running on port ${PORT}`);
        });

    } catch (error) {
        console.error('❌ Error connecting to database:', error);
        process.exit(1); // Exit if DB connection fails
    }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    await prisma.$disconnect();
    console.log('🛑 Prisma disconnected. Server shutting down.');
    process.exit(0);
});

startServer();
