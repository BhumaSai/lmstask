import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import { coursesAPI } from '../../services/api';
import type { RootState } from '../../store';
import type { Course } from '../../types';
import { DEFAULT_THUMBNAIL_URL } from '../../constants/courseConstants';

const Dashboard: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [createdCourses, setCreatedCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await (user?.role === 'instructor' 
          ? coursesAPI.getInstructorCourses()
          : coursesAPI.getEnrolledCourses());
        
        setEnrolledCourses(response.data.data);
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Failed to fetch courses');
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [user]);

  const handleDeleteCourse = async (courseId: string) => {
    if (!window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) return;

    try {
      setActionLoading(courseId);
      await coursesAPI.deleteCourse(courseId);
      setEnrolledCourses(enrolledCourses.filter(course => course._id !== courseId));
      toast.success('Course deleted successfully');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to delete course';
      toast.error(errorMessage);
      console.error('Error deleting course:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnenroll = async (courseId: string) => {
    if (!window.confirm('Are you sure you want to unenroll from this course?')) return;

    try {
      setActionLoading(courseId);
      await coursesAPI.unenrollFromCourse(courseId);
      setEnrolledCourses(enrolledCourses.filter(course => course._id !== courseId));
      toast.success('Successfully unenrolled from the course');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to unenroll from course');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">
          {user?.role === 'instructor' ? 'My Courses' : 'My Learning'}
        </h1>
        {user?.role === 'instructor' && (
          <Link to="/courses/create" className="btn btn-primary">
            Create New Course
          </Link>
        )}
      </div>

      {enrolledCourses.length === 0 ? (
        <div className="text-center py-8">
          <h2 className="text-xl text-gray-600">
            {user?.role === 'instructor'
              ? 'You haven\'t created any courses yet.'
              : 'You haven\'t enrolled in any courses yet.'}
          </h2>
          <Link to="/courses" className="btn btn-primary mt-4 inline-block">
            {user?.role === 'instructor'
              ? 'Create Your First Course'
              : 'Browse Courses'}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrolledCourses.map((course) => (
            <div key={course._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative pb-48">
                <img
                  src={course.thumbnail || DEFAULT_THUMBNAIL_URL}
                  alt={course.title}
                  className="absolute h-full w-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = DEFAULT_THUMBNAIL_URL;
                  }}
                />
                {!course.published && (
                  <div className="absolute top-2 right-2">
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                      Draft
                    </span>
                  </div>
                )}
              </div>
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-2 line-clamp-1">{course.title}</h2>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {course.description}
                </p>

                {user?.role === 'instructor' ? (
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Enrolled Students:</span>
                      <span>{course.enrolledStudents.length}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Status:</span>
                      <span className={course.published ? 'text-green-600' : 'text-yellow-600'}>
                        {course.published ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <Link
                        to={`/courses/edit/${course._id}`}
                        className="btn btn-secondary flex-1"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDeleteCourse(course._id)}
                        disabled={actionLoading === course._id}
                        className="btn btn-danger flex-1"
                      >
                        {actionLoading === course._id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-col space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Progress:</span>
                        <span className="text-sm font-semibold">
                          {course.progress ? 
                            `${Math.round((course.progress.completed / course.progress.total) * 100)}%` :
                            '0%'}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full"
                          style={{
                            width: course.progress
                              ? `${Math.round((course.progress.completed / course.progress.total) * 100)}%`
                              : '0%'
                          }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 text-right">
                        {course.progress?.completed || 0} of {course.progress?.total || 0} lessons completed
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Link
                        to={`/courses/${course._id}`}
                        className="btn btn-primary flex-1"
                      >
                        Continue Learning
                      </Link>
                      <button
                        onClick={() => handleUnenroll(course._id)}
                        disabled={actionLoading === course._id}
                        className="btn btn-danger"
                        title="Unenroll from course"
                      >
                        {actionLoading === course._id ? (
                          <div className="animate-spin h-5 w-5 border-t-2 border-b-2 border-white rounded-full" />
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard; 