import axios from 'axios';

const API_URL = '/api/progress';

export interface ModuleProgress {
  module: string;
  completed: boolean;
}

export interface QuizResult {
  quiz: string;
  score: number;
  attempts: number;
}

export interface Progress {
  course: string;
  student: string;
  progress: number;
  moduleProgress: ModuleProgress[];
  quizResults: QuizResult[];
}

export const progressService = {
  // Get course progress
  getCourseProgress: async (courseId: string): Promise<Progress> => {
    const response = await axios.get(`${API_URL}/${courseId}`);
    return response.data;
  },

  // Update module progress
  updateModuleProgress: async (
    courseId: string,
    moduleId: string,
    completed: boolean
  ): Promise<Progress> => {
    const response = await axios.put(`${API_URL}/${courseId}/module/${moduleId}`, {
      completed
    });
    return response.data;
  },

  // Submit quiz answers
  submitQuiz: async (
    courseId: string,
    quizId: string,
    answers: string[]
  ): Promise<{
    enrollment: Progress;
    quizScore: number;
    passed: boolean;
  }> => {
    const response = await axios.post(`${API_URL}/${courseId}/quiz/${quizId}`, {
      answers
    });
    return response.data;
  }
}; 