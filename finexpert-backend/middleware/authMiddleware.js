const jwt = require('jsonwebtoken');
require('dotenv').config();

const authMiddleware = (req, res, next) => {
    const token = req.header('Authorization');

    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Add user data to request object
        next(); // Move to the next middleware/controller
    } catch (error) {
        res.status(400).json({ message: 'Invalid token' });
    }
};

module.exports = authMiddleware;
