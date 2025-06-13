const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const Course = require('../models/Course');
const { upload, handleUploadError } = require('../utils/fileUpload');
const Lesson = require('../models/Lesson');
const path = require('path');
const User = require('../models/User');
const fs = require('fs');

// Middleware to check course ownership
const checkCourseOwnership = async (req, res, next) => {
    try {
        const courseId = req.params.courseId || req.params.id;
        console.log('Checking course ownership:', {
            courseId,
            userId: req.user.id,
            userRole: req.user.role
        });

        const course = await Course.findById(courseId);
        
        if (!course) {
            console.log('Course not found:', courseId);
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        console.log('Course found:', {
            courseId: course._id,
            courseInstructor: course.instructor.toString(),
            requestUser: req.user.id,
            isMatch: course.instructor.toString() === req.user.id
        });

        // Check if the logged-in user is the course instructor
        if (course.instructor.toString() !== req.user.id) {
            console.log('Authorization failed: User is not the course instructor');
            return res.status(403).json({
                success: false,
                message: 'Not authorized to modify this course'
            });
        }

        // Add course to the request object for later use
        req.course = course;
        console.log('Course ownership verified successfully');
        next();
    } catch (err) {
        console.error('Course ownership check error:', err);
        res.status(500).json({
            success: false,
            message: 'Error checking course ownership'
        });
    }
};

// Get all courses (public)
router.get('/', async (req, res) => {
    try {
        const courses = await Course.find()
            .populate('instructor', 'name email')
            .populate({
                path: 'enrolledStudents',
                select: '_id'
            })
            .populate({
                path: 'lessons',
                select: '_id'
            })
            .select('-reviews')
            .lean();
        
        // Format response and handle visibility
        const formattedCourses = courses.map(course => ({
            _id: course._id,
            title: course.title,
            description: course.description,
            instructor: course.instructor,
            thumbnail: course.thumbnail ? `${course.thumbnail}` : "http://localhost:5000/uploads/thumbnails/one.png",
            price: course.price,
            category: course.category,
            level: course.level,
            rating: course.rating,
            enrolledStudents: course.enrolledStudents.map(student => student._id),
            published: course.published,
            lessons: course.lessons.length,
            createdAt: course.createdAt,
            updatedAt: course.updatedAt
        }));

        res.json({
            success: true,
            count: formattedCourses.length,
            data: formattedCourses
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
});

// Get instructor courses
router.get('/instructor', protect, authorize('instructor'), async (req, res) => {
    try {
        const courses = await Course.find({ instructor: req.user.id })
            .populate('instructor', 'name email')
            .select('-reviews');
        
        res.json({
            success: true,
            count: courses.length,
            data: courses
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
});

// Get enrolled courses with progress
router.get('/enrolled', protect, authorize('student'), async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .populate({
                path: 'enrolledCourses',
                populate: {
                    path: 'instructor',
                    select: 'name email'
                }
            })
            .populate('courseProgress');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Format courses with progress
        const formattedCourses = user.enrolledCourses.map(course => {
            const progress = user.courseProgress.find(p => p.course.toString() === course._id.toString());
            return {
                ...course.toObject(),
                progress: progress ? {
                    completedLessons: progress.completedLessons.length,
                    totalLessons: course.lessons.length,
                    lastAccessed: progress.lastAccessed,
                    enrollmentDate: progress.enrollmentDate
                } : null
            };
        });

        res.json({
            success: true,
            count: formattedCourses.length,
            data: formattedCourses
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
});

// Get single course
router.get('/:id', async (req, res) => {
    try {
        const course = await Course.findById(req.params.id)
            .populate('instructor', 'name email')
            .populate('lessons')
            .lean();

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        // Format thumbnail URL
        if (course.thumbnail) {
            course.thumbnail = `${course.thumbnail}`;
        }

        res.json({
            success: true,
            data: course
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
});

// Create course (Instructor only)
router.post('/',
    protect,
    authorize('instructor'),
    async (req, res) => {
        try {
            console.log('Creating course with data:', req.body);

            const { title, description, category, level, price, duration, thumbnail } = req.body;
            
            // Validate required fields
            if (!title || !description || !category || !level) {
                return res.status(400).json({ message: 'Please provide all required fields' });
            }

            // Create course
            const course = new Course({
                title,
                description,
                category,
                level,
                price: price || 0,
                duration: duration || 0,
                instructor: req.user._id,
                published: true,
                modules: [],
                enrolledStudents: [],
                ratings: [],
                averageRating: 0,
                thumbnail: thumbnail || "http://localhost:5000/uploads/thumbnails/one.png"
            });

            // Save the course
            await course.save();
            console.log('Course created with ID:', course._id);

            res.status(201).json({
                success: true,
                course
            });
        } catch (err) {
            console.error('Error creating course:', err);
            res.status(500).json({
                success: false,
                message: 'Error creating course'
            });
        }
    }
);

// Update course
router.put('/:courseId',
    protect,
    authorize('instructor'),
    checkCourseOwnership,
    upload.fields([
        { name: 'thumbnail', maxCount: 1 }
    ]),
    handleUploadError,
    async (req, res) => {
        try {

            const { title, description, price, category, level, published } = req.body;
            const updateData = {};

            // Only update fields that are provided
            if (title) updateData.title = title.trim();
            if (description) updateData.description = description.trim();
            if (price !== undefined) updateData.price = parseFloat(price);
            if (category) updateData.category = category.trim();
            if (level) updateData.level = level.trim();
            if (published !== undefined) updateData.published = published;

            // Handle thumbnail
            if (req.files?.thumbnail) {
                const thumbnailFile = req.files.thumbnail[0];
                
                // Delete old thumbnail if exists
                if (req.course.thumbnail) {
                    const oldPath = path.join(__dirname, '../public', req.course.thumbnail);
                    if (fs.existsSync(oldPath)) {
                        fs.unlinkSync(oldPath);
                    }
                }

                const fileExtension = path.extname(thumbnailFile.originalname);
                const newFilename = `${req.course._id}${fileExtension}`;
                
                // Move the new file
                const oldPath = thumbnailFile.path;
                const newPath = path.join(__dirname, '../public/uploads/thumbnails', newFilename);
                fs.renameSync(oldPath, newPath);

                // Update thumbnail URL
                const serverUrl = process.env.API_URL || 'http://localhost:5000';
                updateData.thumbnail = `${serverUrl}/uploads/thumbnails/${newFilename}`;
            }

            // Update course
            const course = await Course.findByIdAndUpdate(
                req.params.courseId,
                { $set: updateData },
                {
                    new: true,
                    runValidators: true
                }
            ).populate('instructor', 'name email');

            if (!course) {
                return res.status(404).json({
                    success: false,
                    message: 'Course not found'
                });
            }

            res.json({
                success: true,
                data: course
            });
        } catch (err) {
            console.error('Error updating course:', err);
            res.status(500).json({
                success: false,
                message: 'Error updating course'
            });
        }
    }
);

// Delete course
router.delete('/:courseId',
    protect,
    authorize('instructor'),
    checkCourseOwnership,
    async (req, res) => {
        try {
            console.log('Deleting course:', {
                courseId: req.params.courseId,
                instructorId: req.user.id
            });

            const course = req.course; // We already have the course from checkCourseOwnership

            // Remove course from instructor's created courses
            await User.findByIdAndUpdate(
                req.user.id,
                { $pull: { createdCourses: course._id } }
            );

            // Remove course from enrolled students' courses
            if (course.enrolledStudents.length > 0) {
                await User.updateMany(
                    { _id: { $in: course.enrolledStudents } },
                    { $pull: { enrolledCourses: course._id } }
                );
            }

            // Delete the course
            await Course.findByIdAndDelete(req.params.courseId);

            // Delete thumbnail if it exists
            if (course.thumbnail) {
                const thumbnailPath = path.join(__dirname, '../public', course.thumbnail);
                if (fs.existsSync(thumbnailPath)) {
                    fs.unlinkSync(thumbnailPath);
                }
            }

            res.json({
                success: true,
                message: 'Course deleted successfully'
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: 'Error deleting course'
            });
        }
    }
);

// Enroll in course
router.post('/:id/enroll', protect, authorize('student'), async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        // Check if course is published
        if (!course.published) {
            return res.status(400).json({
                success: false,
                message: 'Cannot enroll in an unpublished course'
            });
        }

        // Check if already enrolled
        if (course.enrolledStudents.includes(req.user.id)) {
            return res.status(400).json({
                success: false,
                message: 'Already enrolled in this course'
            });
        }

        // Create progress tracking for the student
        const progress = {
            student: req.user.id,
            course: course._id,
            completedLessons: [],
            lastAccessed: new Date(),
            enrollmentDate: new Date()
        };

        // Add student to course
        course.enrolledStudents.push(req.user.id);
        await course.save();

        // Add course to student's enrolled courses
        await User.findByIdAndUpdate(
            req.user.id,
            { 
                $push: { 
                    enrolledCourses: course._id,
                    courseProgress: progress
                }
            },
            { new: true }
        );

        res.json({
            success: true,
            message: 'Successfully enrolled in course',
            data: {
                courseId: course._id,
                progress: progress
            }
        });
    } catch (err) {
        console.error('Enrollment error:', err);
        res.status(500).json({
            success: false,
            message: 'Error enrolling in course'
        });
    }
});

// Track lesson completion
router.post('/:courseId/lessons/:lessonId/complete', protect, authorize('student'), async (req, res) => {
    try {
        const { courseId, lessonId } = req.params;
        const user = await User.findById(req.user.id);

        // Find course progress
        const progressIndex = user.courseProgress.findIndex(
            p => p.course.toString() === courseId
        );

        if (progressIndex === -1) {
            return res.status(400).json({
                success: false,
                message: 'Not enrolled in this course'
            });
        }

        // Add lesson to completed lessons if not already completed
        if (!user.courseProgress[progressIndex].completedLessons.includes(lessonId)) {
            user.courseProgress[progressIndex].completedLessons.push(lessonId);
            user.courseProgress[progressIndex].lastAccessed = new Date();
            await user.save();
        }

        // Calculate progress percentage
        const course = await Course.findById(courseId);
        const totalLessons = course.lessons.length;
        const completedLessons = user.courseProgress[progressIndex].completedLessons.length;
        const progressPercentage = Math.round((completedLessons / totalLessons) * 100);

        res.json({
            success: true,
            message: 'Lesson marked as complete',
            data: {
                progress: progressPercentage,
                completedLessons,
                totalLessons,
                lastAccessed: user.courseProgress[progressIndex].lastAccessed
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
});

// Unenroll from course
router.delete('/:id/enroll', protect, authorize('student'), async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        // Remove student from course's enrolled students
        course.enrolledStudents = course.enrolledStudents.filter(
            id => id.toString() !== req.user.id
        );
        await course.save();

        // Remove course from user's enrolled courses and progress
        const user = await User.findById(req.user.id);
        user.enrolledCourses = user.enrolledCourses.filter(
            id => id.toString() !== course._id.toString()
        );
        user.courseProgress = user.courseProgress.filter(
            p => p.course.toString() !== course._id.toString()
        );
        await user.save();

        res.json({
            success: true,
            message: 'Successfully unenrolled from course'
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
});

// Add review to course (Student only)
router.post('/:id/reviews',
    protect,
    authorize('student'),
    [
        body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
        body('comment').notEmpty().withMessage('Comment is required')
    ],
    async (req, res) => {
        try {
            const course = await Course.findById(req.params.id);

            if (!course) {
                return res.status(404).json({
                    success: false,
                    message: 'Course not found'
                });
            }

            // Check if already reviewed
            if (course.reviews.find(review => review.user.toString() === req.user.id)) {
                return res.status(400).json({
                    success: false,
                    message: 'Already reviewed this course'
                });
            }

            const { rating, comment } = req.body;

            course.reviews.push({
                user: req.user.id,
                rating,
                comment
            });

            // Update course rating
            const totalRating = course.reviews.reduce((acc, item) => item.rating + acc, 0);
            course.rating = totalRating / course.reviews.length;

            await course.save();

            res.json({
                success: true,
                data: course
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: 'Server Error'
            });
        }
    }
);

// Update course content
router.put('/:courseId/content/:contentId',
    protect,
    authorize('instructor'),
    checkCourseOwnership,
    upload.fields([
        { name: 'content', maxCount: 1 }
    ]),
    async (req, res) => {
        try {
            console.log('Updating content with data:', {
                courseId: req.params.courseId,
                contentId: req.params.contentId,
                body: req.body,
                files: req.files
            });

            const { title, description, contentType } = req.body;
            const contentIndex = req.course.lessons.findIndex(
                lesson => lesson._id.toString() === req.params.contentId
            );

            if (contentIndex === -1) {
                return res.status(404).json({
                    success: false,
                    message: 'Content not found in this course'
                });
            }

            let contentUrl = req.course.lessons[contentIndex].content; // Keep existing content URL by default
            let duration = req.course.lessons[contentIndex].duration;

            // Handle different content types
            if (contentType === 'text') {
                if (req.body.content) {
                    contentUrl = req.body.content;
                }
            } else if ((contentType === 'pdf' || contentType === 'video') && req.files?.content) {
                contentUrl = `/uploads/content/${req.files.content[0].filename}`;
                
                // For video content, update duration if provided
                if (contentType === 'video' && req.body.duration) {
                    duration = parseFloat(req.body.duration);
                }
            }

            // Update the lesson
            req.course.lessons[contentIndex] = {
                ...req.course.lessons[contentIndex],
                title: title || req.course.lessons[contentIndex].title,
                description: description || req.course.lessons[contentIndex].description,
                contentType: contentType || req.course.lessons[contentIndex].contentType,
                content: contentUrl,
                duration
            };

            await req.course.save();

            res.json({
                success: true,
                data: req.course.lessons[contentIndex]
            });
        } catch (err) {
            console.error('Error updating content:', err);
            res.status(500).json({
                success: false,
                message: 'Error updating course content'
            });
        }
    }
);

// Add content to course
router.post('/:courseId/content',
    protect,
    authorize('instructor'),
    checkCourseOwnership,
    upload.fields([
        { name: 'content', maxCount: 1 }
    ]),
    async (req, res) => {
        try {
            console.log('Adding content with data:', {
                courseId: req.params.courseId,
                body: req.body,
                files: req.files
            });

            const { title, description, contentType } = req.body;

            // Validate required fields
            if (!title || !contentType) {
                return res.status(400).json({
                    success: false,
                    message: 'Please provide title and content type'
                });
            }

            let contentUrl = '';
            let duration = null;

            // Handle different content types
            if (contentType === 'text') {
                if (!req.body.content) {
                    return res.status(400).json({
                        success: false,
                        message: 'Please provide content for text type'
                    });
                }
                contentUrl = req.body.content;
            } else if (contentType === 'pdf' || contentType === 'video') {
                if (!req.files?.content) {
                    return res.status(400).json({
                        success: false,
                        message: `Please upload a ${contentType} file`
                    });
                }
                contentUrl = `/uploads/content/${req.files.content[0].filename}`;
                
                // For video content, store duration if provided
                if (contentType === 'video' && req.body.duration) {
                    duration = parseFloat(req.body.duration);
                }
            }

            const lesson = {
                title: title.trim(),
                description: description ? description.trim() : '',
                contentType,
                content: contentUrl,
                duration
            };

            req.course.lessons.push(lesson);
            await req.course.save();

            res.status(201).json({
                success: true,
                data: lesson
            });
        } catch (err) {
            console.error('Error adding content:', err);
            res.status(500).json({
                success: false,
                message: 'Error adding content to course'
            });
        }
    }
);

// Delete course content
router.delete('/:courseId/content/:contentId',
    protect,
    authorize('instructor'),
    checkCourseOwnership,
    async (req, res) => {
        try {
            console.log('Deleting content:', {
                courseId: req.params.courseId,
                contentId: req.params.contentId
            });

            const contentIndex = req.course.lessons.findIndex(
                lesson => lesson._id.toString() === req.params.contentId
            );

            if (contentIndex === -1) {
                return res.status(404).json({
                    success: false,
                    message: 'Content not found in this course'
                });
            }

            // Remove the lesson
            req.course.lessons.splice(contentIndex, 1);
            await req.course.save();

            res.json({
                success: true,
                message: 'Content deleted successfully'
            });
        } catch (err) {
            console.error('Error deleting content:', err);
            res.status(500).json({
                success: false,
                message: 'Error deleting course content'
            });
        }
    }
);

// Serve uploaded files
router.get('/uploads/:courseId/:filename', async (req, res) => {
    const filePath = path.join(__dirname, '../uploads', req.params.courseId, req.params.filename);
    res.sendFile(filePath);
});

// Update course publish status (Instructor only)
router.patch('/:id/publish',
    protect,
    authorize('instructor'),
    async (req, res) => {
        try {
            const course = await Course.findById(req.params.id);

            if (!course) {
                return res.status(404).json({
                    success: false,
                    message: 'Course not found'
                });
            }

            // Check if user is course instructor
            if (course.instructor.toString() !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to update this course'
                });
            }

            // Check if course has required fields and at least one lesson
            if (!course.title || !course.description || !course.category || course.lessons.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Course must have all required fields and at least one lesson before publishing'
                });
            }

            course.published = !course.published;
            await course.save();

            res.json({
                success: true,
                data: course
            });
        } catch (err) {
            console.error('Course publish error:', err);
            res.status(500).json({
                success: false,
                message: 'Error updating course publish status'
            });
        }
    }
);

// Publish course
router.put('/:id/publish', protect, authorize('instructor'), checkCourseOwnership, async (req, res) => {
    try {
        const course = req.course;

        // Check if course meets basic requirements
        const requirements = {
            hasTitle: !!course.title,
            hasDescription: !!course.description && course.description.length >= 100,
            hasThumbnail: !!course.thumbnail,
            hasLessons: course.lessons && course.lessons.length > 0,
            hasMinimumLessons: course.lessons && course.lessons.length >= 3
        };

        const meetsRequirements = Object.values(requirements).every(req => req === true);
        
        if (!meetsRequirements) {
            return res.status(400).json({
                success: false,
                message: 'Course does not meet publish requirements',
                requirements
            });
        }

        // Update course status
        course.published = true;
        await course.save();

        res.json({
            success: true,
            message: 'Course published successfully',
            data: course
        });
    } catch (err) {
        console.error('Error publishing course:', err);
        res.status(500).json({
            success: false,
            message: 'Error publishing course'
        });
    }
});

// Update course thumbnail
router.patch('/:id/thumbnail', 
    protect, 
    authorize('instructor'), 
    checkCourseOwnership,
    upload.single('thumbnail'),
    handleUploadError,
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No thumbnail file provided'
                });
            }

            const course = req.course;

            // Delete old thumbnail if exists
            if (course.thumbnail) {
                const oldFileName = path.basename(course.thumbnail);
                const oldFilePath = path.join(__dirname, '..', 'public', 'uploads', 'thumbnails', oldFileName);
                if (fs.existsSync(oldFilePath)) {
                    fs.unlinkSync(oldFilePath);
                }
            }

            const thumbnailFile = req.file;
            const fileExtension = path.extname(thumbnailFile.originalname);
            const newFileName = `${course._id}${fileExtension}`;
            const newFilePath = path.join('public/uploads/thumbnails', newFileName);

            // Rename the uploaded file to use course ID
            fs.renameSync(thumbnailFile.path, newFilePath);

            // Update course with the complete thumbnail URL
            const serverUrl = process.env.API_URL || 'http://localhost:5000';
            course.thumbnail = `${serverUrl}/uploads/thumbnails/${newFileName}`;
            await course.save();

            res.json({
                success: true,
                message: 'Course thumbnail updated successfully',
                data: {
                    thumbnail: `${process.env.API_URL || 'http://localhost:5000'}${course.thumbnail}`
                }
            });
        } catch (err) {
            console.error('Error updating course thumbnail:', err);
            res.status(500).json({
                success: false,
                message: 'Error updating course thumbnail'
            });
        }
    }
);

// Add lesson content (PDF or video)
router.post('/:courseId/lessons/:lessonId/content',
    protect,
    authorize('instructor'),
    checkCourseOwnership,
    upload.fields([
        { name: 'video', maxCount: 1 },
        { name: 'pdf', maxCount: 1 }
    ]),
    handleUploadError,
    async (req, res) => {
        try {
            const { courseId, lessonId } = req.params;
            const lesson = await Lesson.findById(lessonId);

            if (!lesson) {
                return res.status(404).json({
                    success: false,
                    message: 'Lesson not found'
                });
            }

            // Handle video upload
            if (req.files.video) {
                // Delete old video if exists
                if (lesson.videoUrl) {
                    const oldPath = path.join(__dirname, '../public', lesson.videoUrl);
                    if (fs.existsSync(oldPath)) {
                        fs.unlinkSync(oldPath);
                    }
                }
                lesson.videoUrl = `/uploads/content/videos/${req.files.video[0].filename}`;
            }

            // Handle PDF upload
            if (req.files.pdf) {
                // Delete old PDF if exists
                if (lesson.pdfUrl) {
                    const oldPath = path.join(__dirname, '../public', lesson.pdfUrl);
                    if (fs.existsSync(oldPath)) {
                        fs.unlinkSync(oldPath);
                    }
                }
                lesson.pdfUrl = `/uploads/content/pdfs/${req.files.pdf[0].filename}`;
            }

            await lesson.save();

            res.json({
                success: true,
                message: 'Lesson content updated successfully',
                data: lesson
            });
        } catch (err) {
            console.error('Error updating lesson content:', err);
            res.status(500).json({
                success: false,
                message: 'Error updating lesson content'
            });
        }
    }
);

module.exports = router; 