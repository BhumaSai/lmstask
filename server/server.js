const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// CORS configuration
app.use(cors({
    origin: 'http://localhost:5173', // Remove trailing slash
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Create upload directories if they don't exist
const createUploadDirs = () => {
    const dirs = [
        'public/uploads',
        'public/uploads/thumbnails',
        'public/uploads/content',
        'public/uploads/content/videos',
        'public/uploads/content/pdfs'
    ];

    dirs.forEach(dir => {
        const fullPath = path.join(__dirname, dir);
        if (!fs.existsSync(fullPath)) {
            fs.mkdirSync(fullPath, { recursive: true });
            console.log(`Created directory: ${fullPath}`);
        }
    });
};

// Create directories on server start
createUploadDirs();

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lms', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.log('MongoDB Connection Error:', err));

// Routes (to be implemented)
app.use('/api/auth', require('./routes/auth.routes'));
// app.use('/api/users', require('./routes/user.routes'));
app.use('/api/courses', require('./routes/course.routes'));
app.use('/api/lessons', require('./routes/lesson.routes'));
app.use('/api/quizzes', require('./routes/quiz.routes'));
// app.use('/api/enrollments', require('./routes/enrollment.routes'));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: err.message || 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 