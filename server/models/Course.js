const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    contentType: {
        type: String,
        enum: ['text', 'pdf', 'video'],
        required: true
    },
    content: {
        type: String,
        required: true
    },
    duration: {
        type: Number,
        default: null
    }
}, { timestamps: true });

const courseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a course title'],
        trim: true,
        maxlength: [100, 'Title cannot be more than 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Please add a description'],
        maxlength: [2000, 'Description cannot be more than 2000 characters']
    },
    instructor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    thumbnail: {
        type: String,
        default: "http://localhost:5000/uploads/thumbnails/one.png"
    },
    price: {
        type: Number,
        default: 0,
        min: [0, 'Price cannot be negative']
    },
    category: {
        type: String,
        required: [true, 'Please add a category'],
        enum: {
            values: [
                'programming',
                'web development',
                'mobile development',
                'data science',
                'machine learning',
                'devops',
                'business',
                'design',
                'other'
            ],
            message: '{VALUE} is not a valid category'
        }
    },
    level: {
        type: String,
        required: [true, 'Please specify the course level'],
        enum: {
            values: ['beginner', 'intermediate', 'advanced'],
            message: '{VALUE} is not a valid level'
        }
    },
    published: {
        type: Boolean,
        default: false
    },
    enrolledStudents: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    lessons: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lesson'
    }],
    rating: {
        type: Number,
        min: [1, 'Rating must be at least 1'],
        max: [5, 'Rating cannot be more than 5'],
        default: 5
    },
    reviews: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5
        },
        comment: {
            type: String,
            required: true,
            maxlength: 500
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Update lastUpdated timestamp before save
courseSchema.pre('save', function(next) {
    this.lastUpdated = Date.now();
    next();
});

// Calculate average rating
courseSchema.methods.getAverageRating = function() {
    if (this.reviews.length === 0) return 5;

    const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
    this.rating = Math.round((sum / this.reviews.length) * 10) / 10;
    return this.rating;
};

const Course = mongoose.model('Course', courseSchema);
module.exports = Course; 