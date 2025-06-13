export interface User {
  _id: string;
  id: string;
  name: string;
  email: string;
  bio?: string;
  firstName?: string;
  lastName?: string;
  role: 'student' | 'instructor' | 'admin';
}

export interface Module {
  _id: string;
  title: string;
  description: string;
  content: ModuleContent;
  duration?: number;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface ModuleContent {
  type: 'text' | 'video' | 'pdf';
  content: string;
  url?: string;
  duration?: number;
}

export interface Question {
  _id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  points: number;
}

export interface Quiz {
  _id: string;
  title: string;
  lesson: string;
  questions: Question[];
  timeLimit: number;
  passingScore: number;
  attempts: QuizAttempt[];
  createdAt: string;
  updatedAt: string;
}

export interface QuizAttempt {
  user: string;
  score: number;
  answers: {
    questionIndex: number;
    selectedAnswer: number;
    isCorrect: boolean;
  }[];
  submittedAt: string;
  passed: boolean;
}

export interface Rating {
  _id: string;
  user: User;
  rating: number;
  review?: string;
  createdAt: string;
}

export interface Lesson {
  _id: string;
  title: string;
  description: string;
  content: string;
  duration: number;
  order: number;
  course: string;
  videoUrl?: string;
  pdfUrl?: string;
  quiz?: Quiz;
}

export interface Course {
  _id: string;
  title: string;
  description: string;
  thumbnail?: string;
  price: number;
  level: string;
  category: string;
  duration: number;
  instructor: User;
  modules: Module[];
  enrolledStudents: Enrollment[];
  ratings: Rating[];
  averageRating: number;
  published: boolean;
  learningObjectives: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Enrollment {
  _id: string;
  course: Course;
  student: User;
  enrolledAt: string;
  progress: number;
  lastAccessed: string;
  completedLessons: string[];
}

export interface RootState {
  auth: {
    user: User | null;
    token: string | null;
    loading: boolean;
    error: string | null;
  };
  courses: {
    courses: Course[];
    currentCourse: Course | null;
    loading: boolean;
    error: string | null;
  };
} 