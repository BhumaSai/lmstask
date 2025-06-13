const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create upload directories if they don't exist
const createUploadDirs = () => {
    const baseDir = path.join(__dirname, '../public/uploads');
    const dirs = [
        path.join(baseDir, 'thumbnails'),
        path.join(baseDir, 'content/videos'),
        path.join(baseDir, 'content/pdfs')
    ];

    // Create base directory first
    if (!fs.existsSync(baseDir)) {
        fs.mkdirSync(baseDir, { recursive: true });
        console.log(`Created base upload directory: ${baseDir}`);
    }

    // Create subdirectories
    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`Created upload directory: ${dir}`);
        }
    });
};

// Call createUploadDirs immediately
createUploadDirs();

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Create upload directories if they don't exist
        const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'thumbnails');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
            console.log(`Created thumbnail upload directory: ${uploadDir}`);
        }
        console.log('Saving file to:', uploadDir);
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // For course creation, use a temporary filename
        // For course update, use the course ID
        const courseId = req.params.id;
        const ext = path.extname(file.originalname);
        
        if (courseId) {
            // Course update - use course ID as filename
            const filename = `${courseId}${ext}`;
            console.log('Using course ID as filename:', filename);
            cb(null, filename);
        } else {
            // Course creation - use timestamp as temporary filename
            const timestamp = Date.now();
            const random = Math.floor(Math.random() * 1000);
            const filename = `temp_${timestamp}_${random}${ext}`;
            console.log('Using temporary filename:', filename);
            cb(null, filename);
        }
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    console.log('Checking file type:', {
        mimetype: file.mimetype,
        originalname: file.originalname
    });

    // Allow only image files
    if (file.mimetype.startsWith('image/')) {
        console.log('File type accepted');
        cb(null, true);
    } else {
        console.log('File type rejected');
        cb(new Error('Only image files are allowed!'), false);
    }
};

// Configure multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Error handling middleware
const handleUploadError = (err, req, res, next) => {
    console.error('Upload error:', err);

    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File size too large. Maximum size is 5MB.'
            });
        }
        return res.status(400).json({
            success: false,
            message: err.message
        });
    } else if (err) {
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }
    next();
};

module.exports = {
    upload,
    handleUploadError
}; 