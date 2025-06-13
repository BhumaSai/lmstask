import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data: any) => api.put('/auth/profile', data),
};

// Courses API
export const coursesAPI = {
  getAllCourses: () => api.get('/courses'),
  getCourse: (id: string) => api.get(`/courses/${id}`),
  createCourse: (data: any) => api.post('/courses', data),
  updateCourse: (id: string, data: any) => api.put(`/courses/${id}`, data),
  deleteCourse: (id: string) => api.delete(`/courses/${id}`),
  enrollInCourse: (id: string) => api.post(`/courses/${id}/enroll`),
  getEnrolledCourses: () => api.get('/courses/enrolled'),
  getInstructorCourses: () => api.get('/courses/instructor'),
  addModule: (courseId: string, data: any) => api.post(`/courses/${courseId}/modules`, data),
  updateModule: (courseId: string, moduleId: string, data: any) => 
    api.put(`/courses/${courseId}/modules/${moduleId}`, data),
  deleteModule: (courseId: string, moduleId: string) => 
    api.delete(`/courses/${courseId}/modules/${moduleId}`),
};

// Quiz API
export const quizAPI = {
  createQuiz: (courseId: string, moduleId: string, data: any) => 
    api.post(`/courses/${courseId}/modules/${moduleId}/quiz`, data),
  getQuiz: (courseId: string, moduleId: string) => 
    api.get(`/courses/${courseId}/modules/${moduleId}/quiz`),
  submitQuiz: (courseId: string, moduleId: string, data: any) => 
    api.post(`/courses/${courseId}/modules/${moduleId}/quiz/submit`, data),
};

// Progress API
export const progressAPI = {
  getCourseProgress: (courseId: string) => api.get(`/progress/course/${courseId}`),
  updateLessonProgress: (courseId: string, moduleId: string, data: any) => 
    api.put(`/progress/course/${courseId}/module/${moduleId}`, data),
  getModuleProgress: (courseId: string, moduleId: string) => 
    api.get(`/progress/course/${courseId}/module/${moduleId}`),
};

// Admin API
export const adminAPI = {
  getAllUsers: () => api.get('/admin/users'),
  updateUser: (id: string, data: any) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
  getAllCourses: () => api.get('/admin/courses'),
  approveCourse: (id: string) => api.put(`/admin/courses/${id}/approve`),
  rejectCourse: (id: string) => api.put(`/admin/courses/${id}/reject`),
};

export default api; 