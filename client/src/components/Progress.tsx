import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { progressAPI } from '../services/api';
import type { Course, Lesson } from '../types';

interface ProgressProps {
  courseId: string;
}

interface LessonProgress {
  lesson: Lesson;
  status: 'not_started' | 'in_progress' | 'completed';
  progress: number;
  lastAccessed: string;
  completedAt?: string;
  quizAttempts: {
    score: number;
    passed: boolean;
    submittedAt: string;
  }[];
}

const Progress: React.FC<ProgressProps> = ({ courseId }) => {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<{
    overallProgress: number;
    lessons: LessonProgress[];
  } | null>(null);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const response = await progressAPI.getCourseProgress(courseId);
        setProgress(response.data.data);
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Failed to load progress');
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [courseId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="text-center text-red-600 p-4">
        Progress not found
      </div>
    );
  }

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Course Progress</h2>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className="bg-primary-600 h-4 rounded-full transition-all duration-500"
            style={{ width: `${progress.overallProgress}%` }}
          ></div>
        </div>
        <div className="text-right mt-1">
          <span className="text-lg font-semibold">
            {progress.overallProgress.toFixed(1)}%
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {progress.lessons.map((lessonProgress, index) => (
          <div key={lessonProgress.lesson._id} className="border rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-semibold">
                  {index + 1}. {lessonProgress.lesson.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {lessonProgress.lesson.description}
                </p>
              </div>
              <span className={`px-2 py-1 rounded text-sm font-medium ${
                lessonProgress.status === 'completed'
                  ? 'bg-green-100 text-green-800'
                  : lessonProgress.status === 'in_progress'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {lessonProgress.status.replace('_', ' ')}
              </span>
            </div>

            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${lessonProgress.progress}%` }}
                ></div>
              </div>
              <div className="text-right mt-1">
                <span className="text-sm text-gray-600">
                  {lessonProgress.progress}% Complete
                </span>
              </div>
            </div>

            {lessonProgress.quizAttempts.length > 0 && (
              <div className="mt-2">
                <h4 className="text-sm font-medium mb-1">Quiz Results:</h4>
                <div className="space-y-1">
                  {lessonProgress.quizAttempts.map((attempt, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center text-sm"
                    >
                      <span>
                        Attempt {i + 1} - {new Date(attempt.submittedAt).toLocaleDateString()}
                      </span>
                      <span className={`font-medium ${
                        attempt.passed ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {attempt.score.toFixed(1)}% - {attempt.passed ? 'Passed' : 'Failed'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-2 text-sm text-gray-500">
              Last accessed: {new Date(lessonProgress.lastAccessed).toLocaleString()}
              {lessonProgress.completedAt && (
                <span className="ml-2">
                  • Completed: {new Date(lessonProgress.completedAt).toLocaleString()}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Progress; 