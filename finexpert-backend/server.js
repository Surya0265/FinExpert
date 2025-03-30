const express = require('express');
const cors = require('cors');
require('dotenv').config();
const sequelize = require('./models/index'); // Import Sequelize connection
const authRoutes = require('./routes/authRoutes');
const expenseRoutes = require('./routes/expenseRoutes');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);

// Function to start server after DB connection
async function startServer() {
    try {
        await sequelize.authenticate(); // Connect to DB
        console.log('✅ Database connected successfully');

        await sequelize.sync(); // Sync models with DB
        console.log('✅ Tables synchronized');

        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => {
            console.log(`🚀 Server is running on port ${PORT}`);
        });

    } catch (error) {
        console.error('❌ Error connecting to database:', error);
        process.exit(1); // Exit if DB connection fails
    }
}

startServer();
