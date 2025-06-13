const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { protect } = require('../middleware/auth');

// Register user
router.post('/register',
    [
        body('name').notEmpty().withMessage('Name is required'),
        body('email').isEmail().withMessage('Please include a valid email'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
        body('role').isIn(['student', 'instructor']).withMessage('Invalid role')
    ],
    async (req, res) => {
        try {
            const { name, email, password, role } = req.body;

            let user = await User.findOne({ email });
            if (user) {
                return res.status(400).json({
                    success: false,
                    message: 'User already exists'
                });
            }

            user = new User({
                name,
                email,
                password,
                role
            });

            await user.save();

            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
                expiresIn: '30d'
            });

            res.status(201).json({
                success: true,
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({
                success: false,
                message: 'Server Error'
            });
        }
    }
);

// Login user
router.post('/login',
    [
        body('email').isEmail().withMessage('Please include a valid email'),
        body('password').exists().withMessage('Password is required')
    ],
    async (req, res) => {

        try {
            const { email, password } = req.body;
            // Validate request body
            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Please provide both email and password'
                });
            }

            const user = await User.findOne({ email }).select('+password');
            if (!user) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            const isMatch = await user.matchPassword(password);
            if (!isMatch) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
                expiresIn: '30d'
            });

            res.json({
                success: true,
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            });
        } catch (err) {
            console.error('Login error:', err);
            res.status(500).json({
                success: false,
                message: 'Server Error'
            });
        }
    }
);

// Get current user
router.get('/me', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json({
            success: true,
            user
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
});

module.exports = router; 