const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');// Import Sequelize User model
require('dotenv').config();

const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user using Sequelize ORM
        const newUser = await User.create({
            name,
            email,
            password_hash: hashedPassword, // Ensure correct column name
        });

        res.status(201).json({ message: 'User registered successfully', user: newUser });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Error registering user' });
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email using Sequelize ORM
        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Compare password with hashed password in DB
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign({ user_id: user.user_id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.json({ message: 'Login successful', token });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Error logging in' });
    }
};

module.exports = { registerUser, loginUser };