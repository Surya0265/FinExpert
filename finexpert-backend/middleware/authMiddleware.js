const jwt = require('jsonwebtoken');
require('dotenv').config();

const authMiddleware = (req, res, next) => {
    const authHeader = req.header('Authorization');

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(" ")[1]; // Extract actual token

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;  // Attach user data to request
        next();  // Proceed to next middleware/controller
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};

module.exports = authMiddleware;
