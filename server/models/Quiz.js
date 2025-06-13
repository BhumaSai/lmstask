const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    lesson: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lesson',
        required: true
    },
    questions: [{
        question: {
            type: String,
            required: true
        },
        options: [{
            type: String,
            required: true
        }],
        correctAnswer: {
            type: Number, // Index of the correct option
            required: true
        },
        points: {
            type: Number,
            default: 1
        }
    }],
    timeLimit: {
        type: Number, // in minutes
        default: 30
    },
    passingScore: {
        type: Number,
        default: 70 // percentage
    },
    attempts: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        score: Number,
        answers: [{
            questionIndex: Number,
            selectedAnswer: Number,
            isCorrect: Boolean
        }],
        submittedAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

const Quiz = mongoose.model('Quiz', quizSchema);
module.exports = Quiz; 