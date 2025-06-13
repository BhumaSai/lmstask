import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import type { Course, RootState } from '../../types';
import { coursesAPI } from '../../services/api';
import { DEFAULT_THUMBNAIL_URL } from '../../constants/courseConstants';

const CourseDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        if (!id) {
          setError('Course ID is missing');
          return;
        }

        const response = await coursesAPI.getCourse(id);
        setCourse(response.data.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch course details');
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [id]);

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/courses/${id}` } });
      return;
    }

    if (!course) return;

    // Prevent instructors from enrolling
    if (user?.role === 'instructor') {
      toast.error('Instructors cannot enroll in courses');
      return;
    }

    try {
      setActionLoading(true);
      await coursesAPI.enrollInCourse(id!);
      toast.success('Successfully enrolled in the course!');
      // Refresh course data to update enrollment status
      const response = await coursesAPI.getCourse(id!);
      setCourse(response.data.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to enroll in course');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!course) return;

    try {
      setActionLoading(true);
      await coursesAPI.updateCourse(course._id, { published: true });
      toast.success('Course published successfully!');
      // Refresh course data
      const response = await coursesAPI.getCourse(id!);
      setCourse(response.data.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to publish course');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">{error || 'Course not found'}</div>
        <Link to="/courses" className="btn btn-primary">
          Browse Other Courses
        </Link>
      </div>
    );
  }

  const isEnrolled = course.enrolledStudents.includes(user?.id || '');
  const isInstructor = user?.id === course.instructor._id;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Course Header */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
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
        </div>
        <div className="p-6">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{course.title}</h1>
              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 mb-4">
                <span>By {course.instructor.name}</span>
                <span className="hidden lg:inline">•</span>
                <span>{course.category}</span>
                <span className="hidden lg:inline">•</span>
                <span className="capitalize">{course.level}</span>
                {isInstructor && (
                  <>
                    <span className="hidden lg:inline">•</span>
                    <span className={course.published ? 'text-green-600' : 'text-yellow-600'}>
                      {course.published ? 'Published' : 'Draft'}
                    </span>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex flex-col lg:items-end gap-4">
              <div className="text-2xl font-bold">
                {course.price === 0 ? 'Free' : `$${course.price.toFixed(2)}`}
              </div>
              {isInstructor ? (
                <div className="flex space-x-2">
                  <Link
                    to={`/courses/edit/${course._id}`}
                    className="btn btn-secondary"
                  >
                    Edit Course
                  </Link>
                  {!course.published && (
                    <button
                      onClick={handlePublish}
                      disabled={actionLoading}
                      className="btn btn-primary"
                    >
                      {actionLoading ? 'Publishing...' : 'Publish Course'}
                    </button>
                  )}
                </div>
              ) : (
                !isEnrolled && user?.role === 'student' && (
                  <button
                    onClick={handleEnroll}
                    disabled={actionLoading}
                    className="btn btn-primary w-full lg:w-auto"
                  >
                    {actionLoading ? 'Enrolling...' : 'Enroll Now'}
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {/* Description */}
          <div className="bg-white shadow-md rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">Course Description</h2>
            <p className="text-gray-600 whitespace-pre-line">{course.description}</p>
          </div>

          {/* Lessons */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Course Content</h2>
            {course.lessons.length === 0 ? (
              <p className="text-gray-600">No lessons available yet.</p>
            ) : (
              <div className="space-y-4">
                {course.lessons.map((lesson, index) => (
                  <div
                    key={lesson._id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div>
                      <h3 className="font-semibold">
                        {index + 1}. {lesson.title}
                      </h3>
                      <p className="text-sm text-gray-600">{lesson.description}</p>
                    </div>
                    {(isEnrolled || isInstructor) && (
                      <Link
                        to={`/courses/${course._id}/lessons/${lesson._id}`}
                        className="btn btn-secondary"
                      >
                        {isInstructor ? 'Preview' : 'Start'} Lesson
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Instructor Info */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Instructor</h2>
            <div className="flex items-center space-x-4 mb-4">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-2xl text-gray-600">
                    {course.instructor.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div>
                <h3 className="font-semibold">{course.instructor.name}</h3>
                <p className="text-sm text-gray-600">{course.instructor.bio || 'No bio available'}</p>
              </div>
            </div>
          </div>

          {/* Course Stats */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Course Stats</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Students</span>
                <span className="font-semibold">{course.enrolledStudents.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Lessons</span>
                <span className="font-semibold">{course.lessons.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Rating</span>
                <div className="flex items-center">
                  <span className="font-semibold mr-1">{course.rating.toFixed(1)}</span>
                  <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetails; 