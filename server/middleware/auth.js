const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
    try {
        
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            console.log('No token found in request');
            return res.status(401).json({
                success: false,
                message: 'Please login to access this resource'
            });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            const user = await User.findById(decoded.id);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found'
                });
            }

            req.user = user;
            next();
        } catch (err) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Authentication error'
        });
    }
};

exports.authorize = (...roles) => {
    return (req, res, next) => {

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `User role ${req.user.role} is not authorized to access this route`
            });
        }

        next();
    };
}; 