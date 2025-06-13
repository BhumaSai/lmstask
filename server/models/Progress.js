const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    lessons: [{
        lesson: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Lesson'
        },
        status: {
            type: String,
            enum: ['not_started', 'in_progress', 'completed'],
            default: 'not_started'
        },
        progress: {
            type: Number,
            default: 0
        },
        lastAccessed: {
            type: Date,
            default: Date.now
        },
        completedAt: Date,
        quizAttempts: [{
            quiz: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Quiz'
            },
            score: Number,
            maxScore: Number,
            passed: Boolean,
            submittedAt: {
                type: Date,
                default: Date.now
            },
            answers: [{
                questionIndex: Number,
                selectedAnswer: Number,
                isCorrect: Boolean
            }]
        }]
    }],
    overallProgress: {
        type: Number,
        default: 0
    },
    lastAccessed: {
        type: Date,
        default: Date.now
    },
    completedAt: Date,
    certificateIssued: {
        type: Boolean,
        default: false
    },
    certificateUrl: String
}, {
    timestamps: true
});

// Index for efficient querying
progressSchema.index({ student: 1, course: 1 }, { unique: true });

// Method to calculate overall progress
progressSchema.methods.calculateProgress = function() {
    if (this.lessons.length === 0) return 0;
    
    const completedLessons = this.lessons.filter(lesson => 
        lesson.status === 'completed' && 
        lesson.quizAttempts.length > 0 && 
        lesson.quizAttempts[lesson.quizAttempts.length - 1].passed
    );
    
    return (completedLessons.length / this.lessons.length) * 100;
};

// Method to update lesson progress
progressSchema.methods.updateLessonProgress = async function(lessonId, progress) {
    const lesson = this.lessons.find(l => l.lesson.toString() === lessonId.toString());
    if (lesson) {
        lesson.progress = progress;
        if (progress === 100) {
            lesson.status = 'completed';
            lesson.completedAt = new Date();
        } else if (progress > 0) {
            lesson.status = 'in_progress';
        }
        lesson.lastAccessed = new Date();
        await this.save();
    }
};

// Method to add quiz attempt
progressSchema.methods.addQuizAttempt = async function(lessonId, quizId, attempt) {
    const lesson = this.lessons.find(l => l.lesson.toString() === lessonId.toString());
    if (lesson) {
        lesson.quizAttempts.push({
            quiz: quizId,
            ...attempt
        });
        await this.save();
    }
};

const Progress = mongoose.model('Progress', progressSchema);
module.exports = Progress; 