const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const Quiz = require('../models/Quiz');
const Lesson = require('../models/Lesson');

// Get quiz by lesson ID
router.get('/lesson/:lessonId', protect, async (req, res) => {
    try {
        const quiz = await Quiz.findOne({ lesson: req.params.lessonId })
            .select(req.user.role === 'student' ? '-questions.correctAnswer' : '');

        if (!quiz) {
            return res.status(404).json({
                success: false,
                message: 'Quiz not found'
            });
        }

        res.json({
            success: true,
            data: quiz
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
});

// Create quiz (Instructor only)
router.post('/',
    protect,
    authorize('instructor', 'admin'),
    [
        body('title').notEmpty().withMessage('Title is required'),
        body('lesson').notEmpty().withMessage('Lesson ID is required'),
        body('questions').isArray().withMessage('Questions must be an array'),
        body('questions.*.question').notEmpty().withMessage('Question text is required'),
        body('questions.*.options').isArray({ min: 2 }).withMessage('At least 2 options are required'),
        body('questions.*.correctAnswer').isNumeric().withMessage('Correct answer must be specified')
    ],
    async (req, res) => {
        try {
            const lesson = await Lesson.findById(req.body.lesson)
                .populate('course');

            if (!lesson) {
                return res.status(404).json({
                    success: false,
                    message: 'Lesson not found'
                });
            }

            // Check if user is course instructor
            if (lesson.course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
                return res.status(401).json({
                    success: false,
                    message: 'Not authorized to add quiz to this lesson'
                });
            }

            const quiz = new Quiz(req.body);
            await quiz.save();

            // Update lesson with quiz reference
            lesson.quiz = quiz._id;
            await lesson.save();

            res.status(201).json({
                success: true,
                data: quiz
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: 'Server Error'
            });
        }
    }
);

// Update quiz (Instructor only)
router.put('/:id',
    protect,
    authorize('instructor', 'admin'),
    async (req, res) => {
        try {
            let quiz = await Quiz.findById(req.params.id);

            if (!quiz) {
                return res.status(404).json({
                    success: false,
                    message: 'Quiz not found'
                });
            }

            const lesson = await Lesson.findById(quiz.lesson)
                .populate('course');

            // Check if user is course instructor
            if (lesson.course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
                return res.status(401).json({
                    success: false,
                    message: 'Not authorized to update this quiz'
                });
            }

            quiz = await Quiz.findByIdAndUpdate(req.params.id, req.body, {
                new: true,
                runValidators: true
            });

            res.json({
                success: true,
                data: quiz
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: 'Server Error'
            });
        }
    }
);

// Submit quiz attempt (Student only)
router.post('/:id/submit',
    protect,
    authorize('student'),
    [
        body('answers').isArray().withMessage('Answers must be an array'),
        body('answers.*.questionIndex').isNumeric().withMessage('Question index is required'),
        body('answers.*.selectedAnswer').isNumeric().withMessage('Selected answer is required')
    ],
    async (req, res) => {
        try {
            const quiz = await Quiz.findById(req.params.id);

            if (!quiz) {
                return res.status(404).json({
                    success: false,
                    message: 'Quiz not found'
                });
            }

            const { answers } = req.body;
            let score = 0;
            const gradedAnswers = answers.map(answer => {
                const isCorrect = quiz.questions[answer.questionIndex].correctAnswer === answer.selectedAnswer;
                if (isCorrect) score += quiz.questions[answer.questionIndex].points || 1;
                return {
                    ...answer,
                    isCorrect
                };
            });

            const totalPoints = quiz.questions.reduce((sum, q) => sum + (q.points || 1), 0);
            const percentageScore = (score / totalPoints) * 100;

            const attempt = {
                user: req.user.id,
                score: percentageScore,
                answers: gradedAnswers,
            };

            quiz.attempts.push(attempt);
            await quiz.save();

            res.json({
                success: true,
                data: {
                    score: percentageScore,
                    passed: percentageScore >= quiz.passingScore,
                    answers: gradedAnswers
                }
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: 'Server Error'
            });
        }
    }
);

// Get quiz attempts for a student
router.get('/:id/attempts',
    protect,
    async (req, res) => {
        try {
            const quiz = await Quiz.findById(req.params.id);

            if (!quiz) {
                return res.status(404).json({
                    success: false,
                    message: 'Quiz not found'
                });
            }

            const attempts = quiz.attempts.filter(
                attempt => attempt.user.toString() === req.user.id
            );

            res.json({
                success: true,
                data: attempts
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