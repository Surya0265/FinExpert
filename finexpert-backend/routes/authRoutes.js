const express = require('express');
const { registerUser, loginUser } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected Route Example (Only accessible if logged in)
router.get('/profile', authMiddleware, (req, res) => {
    res.json({ message: 'User authenticated', userId: req.user.id });
});

module.exports = router;
