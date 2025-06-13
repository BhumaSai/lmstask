import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import { coursesAPI } from '../../services/api';
import { type RootState, type Course, type Module } from '../../types';
import { CourseLevel, CourseCategory, DEFAULT_THUMBNAIL_URL } from '../../constants/courseConstants';

const EditCourse = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [editData, setEditData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    level: '',
    thumbnail: DEFAULT_THUMBNAIL_URL
  });
  const [newModule, setNewModule] = useState({
    title: '',
    description: '',
    contentType: 'text',
    content: '',
    file: null as File | null,
    duration: ''
  });

  useEffect(() => {
    const fetchCourse = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const response = await coursesAPI.getCourse(id);
        const courseData = response.data.data;
        setCourse(courseData);
        setEditData({
          title: courseData.title,
          description: courseData.description,
          price: courseData.price.toString(),
          category: courseData.category,
          level: courseData.level,
          thumbnail: courseData.thumbnail || DEFAULT_THUMBNAIL_URL
        });
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Failed to fetch course');
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [id]);

  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!course) return;

    try {
      setSaving(true);

      // Validate price
      const price = parseFloat(editData.price);
      if (isNaN(price) || price < 0) {
        toast.error('Please enter a valid price');
        return;
      }

      // Update course
      const response = await coursesAPI.updateCourse(course._id, {
        title: editData.title,
        description: editData.description,
        price: price,
        category: editData.category,
        level: editData.level,
        thumbnail: editData.thumbnail
      });

      setCourse(response.data.data);
      toast.success('Course updated successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update course');
    } finally {
      setSaving(false);
    }
  };

  const handleContentFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const allowedTypes = {
        'application/pdf': 'pdf',
        'video/mp4': 'video',
        'video/webm': 'video',
        'video/quicktime': 'video',
        'video/x-msvideo': 'video',
        'video/x-ms-wmv': 'video'
      };

      if (!allowedTypes[file.type as keyof typeof allowedTypes]) {
        toast.error('Invalid file type. Only PDF and video files (MP4, WebM, MOV, AVI, WMV) are allowed!');
        e.target.value = '';
        return;
      }

      // For video files, get duration
      if (file.type.startsWith('video/')) {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => {
          setNewModule(prev => ({
            ...prev,
            duration: Math.round(video.duration).toString()
          }));
        };
        video.src = URL.createObjectURL(file);
      }

      setNewModule(prev => ({
        ...prev,
        file: file,
        contentType: file.type === 'application/pdf' ? 'pdf' : 'video'
      }));
    }
  };

  const handleAddModule = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!course) return;

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append('title', newModule.title);
      formData.append('description', newModule.description);
      formData.append('contentType', newModule.contentType);

      if (newModule.contentType === 'text') {
        formData.append('content', newModule.content);
      } else if (newModule.file) {
        formData.append('file', newModule.file);
        if (newModule.contentType === 'video' && newModule.duration) {
          formData.append('duration', newModule.duration);
        }
      } else {
        toast.error('Please provide content or upload a file');
        return;
      }

      const response = await coursesAPI.addModule(course._id, formData);
      
      // Update course with new module
      setCourse(prev => {
        if (!prev) return null;
        return {
          ...prev,
          modules: [...prev.modules, response.data.data]
        };
      });

      // Reset form
      setNewModule({
        title: '',
        description: '',
        contentType: 'text',
        content: '',
        file: null,
        duration: ''
      });

      toast.success('Module added successfully!');
    } catch (err: any) {
      console.error('Error adding module:', err);
      toast.error(err.response?.data?.message || 'Failed to add module');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!course) return;

    try {
      await coursesAPI.deleteModule(course._id, moduleId);
      
      // Update course state
      setCourse(prev => {
        if (!prev) return null;
        return {
          ...prev,
          modules: prev.modules.filter(module => module._id !== moduleId)
        };
      });

      toast.success('Module deleted successfully!');
    } catch (err: any) {
      console.error('Error deleting module:', err);
      toast.error(err.response?.data?.message || 'Failed to delete module');
    }
  };

  const handleTogglePublish = async () => {
    if (!course) return;

    try {
      setPublishing(true);
      const response = await coursesAPI.updateCourse(course._id, { published: !course.published });
      setCourse(response.data.data);
      toast.success(`Course ${response.data.data.published ? 'published' : 'unpublished'} successfully`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update course status');
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">Course not found</div>
        <button onClick={() => navigate('/dashboard')} className="btn btn-primary">
          Return to Dashboard
        </button>
      </div>
    );
  }

  if (user?.role !== 'instructor' || course.instructor._id !== user?.id) {
    return (
      <div className="text-center text-red-600 p-4">
        Not authorized to edit this course
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Edit Course</h1>
        <button
          onClick={handleTogglePublish}
          disabled={publishing}
          className={`px-4 py-2 rounded-md ${
            course.published
              ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
              : 'bg-green-100 text-green-800 hover:bg-green-200'
          }`}
        >
          {publishing ? 'Updating...' : course.published ? 'Unpublish' : 'Publish'}
        </button>
      </div>

      <form onSubmit={handleUpdateCourse} className="space-y-6">
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Course Details</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={editData.title}
                onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                value={editData.description}
                onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
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
                  value={editData.price}
                  onChange={(e) => setEditData(prev => ({ ...prev, price: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  value={editData.category}
                  onChange={(e) => setEditData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                >
                  <option value="">Select Category</option>
                  {Object.values(CourseCategory).map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Level *
                </label>
                <select
                  value={editData.level}
                  onChange={(e) => setEditData(prev => ({ ...prev, level: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                >
                  <option value="">Select Level</option>
                  {Object.values(CourseLevel).map(level => (
                    <option key={level} value={level}>{level}</option>
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
                value={editData.thumbnail}
                onChange={(e) => setEditData(prev => ({ ...prev, thumbnail: e.target.value }))}
                placeholder="Enter image URL"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              {editData.thumbnail && (
                <div className="mt-4 relative w-full h-48">
                  <img
                    src={editData.thumbnail}
                    alt="Thumbnail preview"
                    className="absolute w-full h-full object-cover rounded-lg"
                    onError={() => setEditData(prev => ({ ...prev, thumbnail: DEFAULT_THUMBNAIL_URL }))}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <button
              type="submit"
              disabled={saving}
              className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </form>

      {/* Add Module Form */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Add New Module</h2>
        <form onSubmit={handleAddModule} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              value={newModule.title}
              onChange={(e) => setNewModule(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={newModule.description}
              onChange={(e) => setNewModule(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={3}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Content Type
            </label>
            <select
              value={newModule.contentType}
              onChange={(e) => setNewModule(prev => ({ ...prev, contentType: e.target.value }))}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="text">Text</option>
              <option value="pdf">PDF</option>
              <option value="video">Video</option>
            </select>
          </div>

          {newModule.contentType === 'text' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Content *
              </label>
              <textarea
                value={newModule.content}
                onChange={(e) => setNewModule(prev => ({ ...prev, content: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={5}
                required
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Upload {newModule.contentType === 'pdf' ? 'PDF' : 'Video'} File *
              </label>
              <input
                type="file"
                onChange={handleContentFileChange}
                accept={newModule.contentType === 'pdf' ? '.pdf' : 'video/*'}
                className="w-full"
                required={newModule.contentType !== 'text'}
              />
              {newModule.file && (
                <p className="mt-2 text-sm text-gray-500">
                  Selected file: {newModule.file.name}
                  {newModule.duration && ` (Duration: ${newModule.duration} seconds)`}
                </p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={uploading}
            className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 disabled:opacity-50 w-full"
          >
            {uploading ? 'Uploading...' : 'Add Module'}
          </button>
        </form>
      </div>

      {/* Module List */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Course Modules</h2>
        {course.modules.length === 0 ? (
          <p className="text-gray-500">No modules added yet.</p>
        ) : (
          <div className="space-y-4">
            {course.modules.map((module: Module, index: number) => (
              <div key={module._id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{index + 1}. {module.title}</h3>
                    <p className="text-sm text-gray-600">{module.description}</p>
                    <div className="text-xs text-gray-500 mt-1 space-x-2">
                      <span>Type: {module.content.type}</span>
                      {module.content.duration && <span>• Duration: {module.content.duration} seconds</span>}
                      {module.content.url && (
                        <a
                          href={module.content.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-700"
                        >
                          View Content
                        </a>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteModule(module._id)}
                    className="text-red-600 hover:text-red-800"
                    title="Delete module"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EditCourse; 