export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'instructor';
}

export interface Course {
  _id: string;
  title: string;
  description: string;
  instructor: {
    _id: string;
    name: string;
    email: string;
    bio?: string;
  };
  thumbnail: string;
  price: number;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  rating: number;
  enrolledStudents: string[];
  lessons: Lesson[];
  published: boolean;
  progress?: {
    completed: number;
    total: number;
  };
}

export interface Lesson {
  _id: string;
  title: string;
  description: string;
  course: string;
  content?: string;
  videoUrl?: string;
  pdfUrl?: string;
  duration?: number;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export interface RootState {
  auth: AuthState;
} 