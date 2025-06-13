const multer = require('multer');
const path = require('path');

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'uploads/';
    
    // Determine subfolder based on file type
    if (file.fieldname === 'thumbnail') {
      uploadPath += 'thumbnails/';
    } else if (file.mimetype.startsWith('video/')) {
      uploadPath += 'videos/';
    } else if (file.mimetype === 'application/pdf') {
      uploadPath += 'pdfs/';
    }
    
    // Create directory if it doesn't exist
    require('fs').mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'thumbnail') {
    // Allow only image files for thumbnails
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed for thumbnails!'), false);
    }
  } else if (file.fieldname === 'content') {
    // Allow PDF and video files for content
    const allowedMimeTypes = [
      'application/pdf',
      'video/mp4',
      'video/webm',
      'video/quicktime',
      'video/x-msvideo',
      'video/x-ms-wmv'
    ];
    
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error('Invalid file type. Only PDF and video files (MP4, WebM, MOV, AVI, WMV) are allowed!'), false);
    }
  }
  
  cb(null, true);
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB max file size
  }
});

module.exports = upload; 