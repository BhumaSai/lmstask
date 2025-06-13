const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    contentType: {
        type: String,
        enum: ['video', 'pdf', 'text'],
        required: true
    },
    content: {
        type: String,
        required: true
    },
    fileUrl: {
        type: String,
        required: function() {
            return ['video', 'pdf'].includes(this.contentType);
        }
    },
    duration: {
        type: Number, // in minutes
        required: function() {
            return this.contentType === 'video';
        }
    },
    order: {
        type: Number,
        required: true
    },
    quiz: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quiz'
    },
    completed: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        completedAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

const Lesson = mongoose.model('Lesson', lessonSchema);
module.exports = Lesson; 