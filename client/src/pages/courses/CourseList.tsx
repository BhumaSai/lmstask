import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import type { Course } from '../../types';
import type { RootState } from '../../store';
import { coursesAPI } from '../../services/api';

interface CourseWithLessonCount extends Omit<Course, 'lessons'> {
  lessons: number;
}

const CourseList = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [courses, setCourses] = useState<CourseWithLessonCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    category: 'all',
    level: 'all',
    search: ''
  });

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await coursesAPI.getAllCourses();
        setCourses(response.data.data);
        setLoading(false);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch courses');
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const handleEnroll = async (courseId: string) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/courses/${courseId}` } });
      return;
    }

    if (user?.role === 'instructor') {
      toast.error('Instructors cannot enroll in courses');
      return;
    }

    try {
      setEnrolling(courseId);
      await coursesAPI.enrollInCourse(courseId);
      toast.success('Successfully enrolled in the course!');
      navigate(`/courses/${courseId}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to enroll in course');
    } finally {
      setEnrolling(null);
    }
  };
  const filteredCourses = courses.filter(course => {
    // Only show published courses to non-instructors
    if (!course.published && (!user || user.id !== course.instructor._id)) {
      return false;
    }

    if (filters.category !== 'all' && course.category !== filters.category) {
      return false;
    }

    if (filters.level !== 'all' && course.level !== filters.level) {
      return false;
    }

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      return (
        course.title.toLowerCase().includes(searchTerm) ||
        course.description.toLowerCase().includes(searchTerm) ||
        course.instructor.name.toLowerCase().includes(searchTerm) ||
        course.category.toLowerCase().includes(searchTerm)
      );
    }

    return true;
  });

  const categories = [...new Set(courses.map(course => course.category))];
  const levels = [...new Set(courses.map(course => course.level))];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        {error}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Available Courses</h1>
        {user?.role === 'instructor' && (
          <Link to="/courses/create" className="btn btn-primary">
            Create New Course
          </Link>
        )}
      </div>

      {/* Search and Filters */}
      <div className="bg-white shadow rounded-lg p-4 mb-8">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search courses..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              className="form-select rounded-md border-gray-300"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <select
              value={filters.level}
              onChange={(e) => setFilters(prev => ({ ...prev, level: e.target.value }))}
              className="form-select rounded-md border-gray-300"
            >
              <option value="all">All Levels</option>
              {levels.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => {
        return(
          <div key={course._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            <div className="relative pb-48">
              <img
                src={course.thumbnail}
                alt={course.title}
                className="absolute h-full w-full object-cover"
              />
              {!course.published && user?.id === course.instructor._id && (
                <div className="absolute top-2 right-2">
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                    Draft
                  </span>
                </div>
              )}
            </div>
            <div className="p-4">
              <h2 className="text-xl font-semibold mb-2 line-clamp-1">{course.title}</h2>
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {course.description}
              </p>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <span className="text-sm text-gray-500">By {course.instructor.name}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm font-semibold">
                    {course.price === 0 ? 'Free' : `$${course.price}`}
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-2 mb-4">
                <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full">
                  {course.level}
                </span>
                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                  {course.category}
                </span>
                <div className="flex items-center ml-auto">
                  <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
              </div>
              <div className="flex space-x-2">
                <Link
                  to={`/courses/${course._id}`}
                  className="btn btn-secondary flex-1"
                >
                  View Details
                </Link>
                {isAuthenticated && user?.role === 'student' && course.published && (
                  <button
                    onClick={() => handleEnroll(course._id)}
                    disabled={enrolling === course._id}
                    className="btn btn-primary flex-1"
                  >
                    {enrolling === course._id ? 'Enrolling...' : 'Enroll Now'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )})}
      </div>

      {filteredCourses.length === 0 && (
        <div className="text-center py-8">
          <h2 className="text-xl text-gray-600">No courses found matching your criteria.</h2>
        </div>
      )}
    </div>
  );
};

export default CourseList; 