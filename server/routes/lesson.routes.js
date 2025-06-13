const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const Lesson = require('../models/Lesson');
const Course = require('../models/Course');
const { upload, handleUploadError } = require('../utils/fileUpload');
const path = require('path');
const fs = require('fs');

// Get all lessons for a course
router.get('/course/:courseId', protect, async (req, res) => {
    try {
        const lessons = await Lesson.find({ course: req.params.courseId })
            .sort('order');

        res.json({
            success: true,
            count: lessons.length,
            data: lessons
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
});

// Get single lesson
router.get('/:id', protect, async (req, res) => {
    try {
        const lesson = await Lesson.findById(req.params.id)
            .populate('course', 'title instructor');

        if (!lesson) {
            return res.status(404).json({
                success: false,
                message: 'Lesson not found'
            });
        }

        res.json({
            success: true,
            data: lesson
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
});

// Create lesson with content
router.post('/',
    protect,
    authorize('instructor'),
    upload.fields([
        { name: 'content', maxCount: 1 }
    ]),
    handleUploadError,
    async (req, res) => {
        try {
            const { title, description, courseId, contentType, order } = req.body;

            // Validate required fields
            if (!title || !courseId || !contentType || !order) {
                return res.status(400).json({
                    success: false,
                    message: 'Please provide all required fields'
                });
            }

            // Check if course exists and user is the instructor
            const course = await Course.findById(courseId);
            if (!course) {
                return res.status(404).json({
                    success: false,
                    message: 'Course not found'
                });
            }

            if (course.instructor.toString() !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to add lessons to this course'
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
                const contentFile = req.files.content[0];
                contentUrl = `/uploads/content/${contentType}s/${contentFile.filename}`;
                
                // For video content, store duration if provided
                if (contentType === 'video' && req.body.duration) {
                    duration = parseFloat(req.body.duration);
                }
            }

            const lesson = new Lesson({
                title: title.trim(),
                description: description ? description.trim() : '',
                course: courseId,
                contentType,
                content: contentUrl,
                duration,
                order: parseInt(order)
            });

            await lesson.save();

            // Add lesson to course
            course.lessons.push(lesson._id);
            await course.save();

            res.status(201).json({
                success: true,
                data: lesson
            });
        } catch (err) {
            console.error('Error creating lesson:', err);
            res.status(500).json({
                success: false,
                message: 'Error creating lesson'
            });
        }
    }
);

// Get lesson content
router.get('/:id/content', protect, async (req, res) => {
    try {
        const lesson = await Lesson.findById(req.params.id);
        if (!lesson) {
            return res.status(404).json({
                success: false,
                message: 'Lesson not found'
            });
        }

        // Check if user is enrolled in the course
        const course = await Course.findById(lesson.course);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        const isEnrolled = course.enrolledStudents.includes(req.user.id);
        const isInstructor = course.instructor.toString() === req.user.id;

        if (!isEnrolled && !isInstructor) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to access this content'
            });
        }

        // For PDF and video content, return the file URL
        if (lesson.contentType === 'pdf' || lesson.contentType === 'video') {
            res.json({
                success: true,
                data: {
                    contentType: lesson.contentType,
                    contentUrl: lesson.content,
                    duration: lesson.duration
                }
            });
        } else {
            // For text content, return the content directly
            res.json({
                success: true,
                data: {
                    contentType: lesson.contentType,
                    content: lesson.content
                }
            });
        }
    } catch (err) {
        console.error('Error getting lesson content:', err);
        res.status(500).json({
            success: false,
            message: 'Error retrieving lesson content'
        });
    }
});

// Update lesson (Instructor only)
router.put('/:id',
    protect,
    authorize('instructor', 'admin'),
    async (req, res) => {
        try {
            let lesson = await Lesson.findById(req.params.id);

            if (!lesson) {
                return res.status(404).json({
                    success: false,
                    message: 'Lesson not found'
                });
            }

            const course = await Course.findById(lesson.course);

            // Check if user is course instructor
            if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
                return res.status(401).json({
                    success: false,
                    message: 'Not authorized to update this lesson'
                });
            }

            lesson = await Lesson.findByIdAndUpdate(req.params.id, req.body, {
                new: true,
                runValidators: true
            });

            res.json({
                success: true,
                data: lesson
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: 'Server Error'
            });
        }
    }
);

// Delete lesson (Instructor only)
router.delete('/:id',
    protect,
    authorize('instructor', 'admin'),
    async (req, res) => {
        try {
            const lesson = await Lesson.findById(req.params.id);

            if (!lesson) {
                return res.status(404).json({
                    success: false,
                    message: 'Lesson not found'
                });
            }

            const course = await Course.findById(lesson.course);

            // Check if user is course instructor
            if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
                return res.status(401).json({
                    success: false,
                    message: 'Not authorized to delete this lesson'
                });
            }

            await lesson.remove();

            // Remove lesson from course
            course.lessons = course.lessons.filter(
                lessonId => lessonId.toString() !== req.params.id
            );
            await course.save();

            res.json({
                success: true,
                message: 'Lesson deleted successfully'
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: 'Server Error'
            });
        }
    }
);

// Mark lesson as completed (Student only)
router.post('/:id/complete',
    protect,
    authorize('student'),
    async (req, res) => {
        try {
            const lesson = await Lesson.findById(req.params.id);

            if (!lesson) {
                return res.status(404).json({
                    success: false,
                    message: 'Lesson not found'
                });
            }

            // Check if already completed
            if (lesson.completed.find(item => item.user.toString() === req.user.id)) {
                return res.status(400).json({
                    success: false,
                    message: 'Lesson already marked as completed'
                });
            }

            lesson.completed.push({
                user: req.user.id
            });

            await lesson.save();

            res.json({
                success: true,
                message: 'Lesson marked as completed'
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: 'Server Error'
            });
        }
    }
);

module.exports = router; 