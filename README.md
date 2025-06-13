# Learning Management System (LMS)

## Features

### For Instructors
- Create and manage courses with detailed information
- Upload course content in multiple formats (text, PDF, video)
- Set course pricing and enrollment options
- Track enrolled students
- Manage course modules and content
- Publish/unpublish courses
- View course analytics and student feedback

### For Students
- Browse and search available courses
- Enroll  courses 
- Track learning progress
- Download course materials
- Rate and review courses

## Tech Stack

### Frontend
- React.js with TypeScript
- Redux Toolkit for state management
- React Router for navigation
- Tailwind CSS for styling
- Axios for API requests
- React Hot Toast for notifications

### Backend
- Node.js with Express
- MongoDB with Mongoose
- JWT for authentication
- Multer for file uploads
- Bcrypt for password hashing
- Express Validator for input validation

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/lmstask.git
cd lms
```

2. Install dependencies for both frontend and backend:
```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

3. Create a `.env` file in the server directory with the following variables:
```env
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=30d
```

4. Create a `.env` file in the client directory:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

## Running the Application

1. Start the backend server:
```bash
cd server
npm run dev
```

2. Start the frontend development server:
```bash
cd client
npm run dev
```

The application will be available at `http://localhost:3000`

## Project Structure

```
lms/
├── client/                # Frontend React application
│   ├── public/            # Static files
│   └── src/
│       ├── components/    # Reusable components
│       ├── pages/         # Page components
│       ├── services/      # API services
│       ├── store/         # Redux store
│       ├── types/         # TypeScript types
│       └── context         # authentication context
│
└── server/               # Backend Node.js application
    ├── middleware/      # Custom middleware
    ├── models           # Mongoose models
    ├── public           # file storage for uploading and server files 
    ├── routes/          # API routes
    └── utils/           # Utility functions
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Courses
- `GET /api/courses` - Get all courses
- `GET /api/courses/:id` - Get single course
- `POST /api/courses` - Create new course (instructor only)
- `PUT /api/courses/:id` - Update course (instructor only)
- `DELETE /api/courses/:id` - Delete course (instructor only)
- `POST /api/courses/:id/enroll` - Enroll in course (student)
- `POST /api/courses/:id/modules` - Add module to course (instructor)

### Progress
- `GET /api/progress` - Get user progress
- `POST /api/progress/:courseId/:moduleId` - Update module progress
- `GET /api/progress/:courseId` - Get course progress
"# lmstask" 
