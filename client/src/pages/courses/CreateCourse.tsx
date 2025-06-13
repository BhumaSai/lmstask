import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import { coursesAPI } from '../../services/api';
import type { RootState } from '../../types';
import { COURSE_CATEGORIES, COURSE_LEVELS } from '../../constants/courseOptions';
import { DEFAULT_THUMBNAIL_URL } from '../../constants/courseConstants';

const CreateCourse = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const [loading, setLoading] = useState(false);
  const [courseData, setCourseData] = useState({
    title: '',
    description: '',
    price: '0',
    category: '',
    level: 'beginner',
    thumbnail: DEFAULT_THUMBNAIL_URL
  });

  if (user?.role !== 'instructor') {
    return (
      <div className="text-center text-red-600 p-4">
        Not authorized. Only instructors can create courses.
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);

      // Validate price
      const price = parseFloat(courseData.price);
      if (isNaN(price) || price < 0) {
        toast.error('Please enter a valid price');
        return;
      }

      // Create course with URL
      const response = await coursesAPI.createCourse({
        ...courseData,
        price,
        thumbnail: courseData.thumbnail || DEFAULT_THUMBNAIL_URL
      });

      toast.success('Course created successfully!');
      navigate(`/courses/${response.data.course._id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Create New Course</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title *
          </label>
          <input
            type="text"
            value={courseData.title}
            onChange={(e) => setCourseData(prev => ({ ...prev, title: e.target.value }))}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description *
          </label>
          <textarea
            value={courseData.description}
            onChange={(e) => setCourseData(prev => ({ ...prev, description: e.target.value }))}
            rows={4}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price (USD)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={courseData.price}
              onChange={(e) => setCourseData(prev => ({ ...prev, price: e.target.value }))}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <select
              value={courseData.category}
              onChange={(e) => setCourseData(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            >
              <option value="">Select Category</option>
              {COURSE_CATEGORIES.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Level *
            </label>
            <select
              value={courseData.level}
              onChange={(e) => setCourseData(prev => ({ ...prev, level: e.target.value }))}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            >
              {COURSE_LEVELS.map(level => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Thumbnail URL
          </label>
          <input
            type="url"
            value={courseData.thumbnail}
            onChange={(e) => setCourseData(prev => ({ ...prev, thumbnail: e.target.value }))}
            placeholder="Enter image URL"
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          {courseData.thumbnail && (
            <div className="mt-4 relative w-full h-48">
              <img
                src={courseData.thumbnail}
                alt="Thumbnail preview"
                className="absolute w-full h-full object-cover rounded-lg"
                onError={() => setCourseData(prev => ({ ...prev, thumbnail: DEFAULT_THUMBNAIL_URL }))}
              />
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Course'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateCourse; 