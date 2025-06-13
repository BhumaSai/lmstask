import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { type Course, type Enrollment } from '../types';
import { DEFAULT_THUMBNAIL_URL } from '../constants/courseConstants';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [enrolledCourses, setEnrolledCourses] = useState<Enrollment[]>([]);
  const [createdCourses, setCreatedCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        if (user?.role === 'student') {
          const response = await axios.get('/api/enrollments/my-courses');
          setEnrolledCourses(response.data);
        } else if (user?.role === 'instructor') {
          const response = await axios.get('/api/courses/my-courses');
          setCreatedCourses(response.data);
        }
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch dashboard data');
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 py-8">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

      {user?.role === 'student' ? (
        // Student Dashboard
        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              My Enrolled Courses
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrolledCourses.map((enrollment) => (
                <div
                  key={enrollment._id}
                  className="bg-white rounded-lg shadow-md overflow-hidden"
                >
                  <img
                    src={enrollment.course.thumbnail || DEFAULT_THUMBNAIL_URL}
                    alt={enrollment.course.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {enrollment.course.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Progress: 0%
                    </p>
                    <div className="mt-4">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full"
                          style={{ width: `${enrollment.progress}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="mt-4 flex justify-between items-center">
                      <span className="text-sm text-gray-500">
                        Last accessed: {new Date(enrollment.lastAccessed).toLocaleDateString()}
                      </span>
                      <button
                        onClick={() => window.location.href = `/courses/${enrollment.course._id}`}
                        className="text-primary-600 hover:text-primary-700"
                      >
                        Continue Learning
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Learning Statistics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-medium text-gray-900">
                  Courses in Progress
                </h3>
                <p className="text-3xl font-bold text-primary-600 mt-2">
                  {enrolledCourses.filter((e) => e.progress < 100).length}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-medium text-gray-900">
                  Completed Courses
                </h3>
                <p className="text-3xl font-bold text-primary-600 mt-2">
                  {enrolledCourses.filter((e) => e.progress === 100).length}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-medium text-gray-900">
                  Average Progress
                </h3>
                <p className="text-3xl font-bold text-primary-600 mt-2">
                  {Math.round(
                    enrolledCourses.reduce((acc, curr) => acc + curr.progress, 0) /
                      (enrolledCourses.length || 1)
                  )}
                  %
                </p>
              </div>
            </div>
          </section>
        </div>
      ) : (
        // Instructor Dashboard
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-gray-900">
              My Courses
            </h2>
            <button
              onClick={() => window.location.href = '/create-course'}
              className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
            >
              Create New Course
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {createdCourses.map((course) => (
              <div
                key={course._id}
                className="bg-white rounded-lg shadow-md overflow-hidden"
              >
                <img
                  src={course.thumbnail || DEFAULT_THUMBNAIL_URL}
                  alt={course.title}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {course.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {course.enrolledStudents.length} students enrolled
                  </p>
                  <div className="mt-4 flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                      Created: {new Date(course.createdAt).toLocaleDateString()}
                    </span>
                    <div className="space-x-2">
                      <button
                        onClick={() => window.location.href = `/courses/${course._id}/edit`}
                        className="text-primary-600 hover:text-primary-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={async () => {
                          if (window.confirm('Are you sure you want to delete this course?')) {
                            try {
                              await axios.delete(`/api/courses/${course._id}`);
                              setCreatedCourses(createdCourses.filter(c => c._id !== course._id));
                            } catch (err) {
                              setError('Failed to delete course');
                            }
                          }
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Course Statistics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-medium text-gray-900">
                  Total Courses
                </h3>
                <p className="text-3xl font-bold text-primary-600 mt-2">
                  {createdCourses.length}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-medium text-gray-900">
                  Total Students
                </h3>
                <p className="text-3xl font-bold text-primary-600 mt-2">
                  {createdCourses.reduce(
                    (acc, course) => acc + course.enrolledStudents.length,
                    0
                  )}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-medium text-gray-900">
                  Average Rating
                </h3>
                <p className="text-3xl font-bold text-primary-600 mt-2">
                  {createdCourses.length
                    ? (
                        createdCourses.reduce(
                          (acc, course) => acc + course.averageRating,
                          0
                        ) / createdCourses.length
                      ).toFixed(1)
                    : '0.0'}
                </p>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 