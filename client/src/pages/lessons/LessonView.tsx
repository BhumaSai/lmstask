import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useSelector } from 'react-redux';
import type { Course, Module, RootState } from '../../types';
import { coursesAPI, progressAPI } from '../../services/api';

const LessonView = () => {
  const { courseId, moduleId } = useParams<{ courseId: string; moduleId: string }>();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [course, setCourse] = useState<Course | null>(null);
  const [currentModule, setCurrentModule] = useState<Module | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contentLoading, setContentLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!courseId || !moduleId) {
          setError('Invalid course or module ID');
          return;
        }

        const courseResponse = await coursesAPI.getCourse(courseId);
        const courseData = courseResponse.data.data;
        setCourse(courseData);

        const moduleData = courseData.modules.find(
          (m: Module) => m._id === moduleId
        );

        if (!moduleData) {
          setError('Module not found');
          return;
        }

        const isInstructor = courseData.instructor._id === user?.id;
        const isEnrolled = courseData.enrolledStudents.includes(user?.id || '');

        if (!isInstructor && !isEnrolled) {
          setError('You do not have access to this module');
          return;
        }

        setCurrentModule(moduleData);
        setContentLoading(false); 

      } catch (err: any) {
        console.error('Error fetching module data:', err);
        setError(err.response?.data?.message || 'Failed to fetch module');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [courseId, moduleId, user?.id]);

  const handleModuleComplete = async () => {
    try {
      if (!courseId || !moduleId) {
        toast.error('Invalid course or module ID');
        return;
      }

      await progressAPI.updateLessonProgress(courseId, moduleId, { completed: true });
      toast.success('Module marked as completed!');
      
      if (course) {
        const currentIndex = course.modules.findIndex(m => m._id === moduleId);
        if (currentIndex < course.modules.length - 1) {
          const nextModule = course.modules[currentIndex + 1];
          navigate(`/courses/${courseId}/modules/${nextModule._id}`);
        } else {
          toast.success('Congratulations! You have completed the course!');
          navigate(`/courses/${courseId}`);
        }
      }
    } catch (err: any) {
      console.error('Error completing module:', err);
      toast.error(err.response?.data?.message || 'Failed to mark module as complete');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !currentModule || !course) {
    return (
      <div className="text-center p-4">
        <div className="text-red-600 mb-4">{error || 'Module not found'}</div>
        <button
          onClick={() => navigate(`/courses/${courseId}`)}
          className="btn btn-secondary"
        >
          Back to Course
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Module List Sidebar */}
        <div className="lg:col-span-1">
          <div className="card p-4">
            <h2 className="text-xl font-bold mb-4">Course Content</h2>
            <div className="space-y-2">
              {course.modules.map((module: Module, index: number) => (
                <button
                  key={module._id}
                  onClick={() => navigate(`/courses/${courseId}/modules/${module._id}`)}
                  className={`w-full text-left p-2 rounded flex items-center ${
                    module._id === moduleId
                      ? 'bg-primary-100 text-primary-700'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-2">{index + 1}.</span>
                  <span className="flex-1">{module.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Module Content */}
        <div className="lg:col-span-3">
          <div className="card p-6">
            <h1 className="text-2xl font-bold mb-4">{currentModule.title}</h1>
            <p className="text-gray-600 mb-6">{currentModule.description}</p>

            {contentLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
              </div>
            ) : (
              <div className="mb-8">
                {currentModule.content.type === 'video' && currentModule.content.url && (
                  <div className="aspect-w-16 aspect-h-9 mb-6">
                    <video
                      src={currentModule.content.url}
                      controls
                      className="w-full h-full rounded-lg"
                      controlsList="nodownload"
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                )}

                {currentModule.content.type === 'pdf' && currentModule.content.url && (
                  <div className="aspect-w-16 aspect-h-9 mb-6">
                    <iframe
                      src={currentModule.content.url}
                      title={currentModule.title}
                      className="w-full h-[600px] rounded-lg"
                    ></iframe>
                  </div>
                )}

                {currentModule.content.type === 'text' && (
                  <div className="prose max-w-none">
                    {currentModule.content.content}
                  </div>
                )}

                {!currentModule.content && (
                  <div className="text-center text-gray-500">
                    No content available for this module.
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-between items-center">
              <button
                onClick={() => navigate(`/courses/${courseId}`)}
                className="btn btn-secondary"
              >
                Back to Course
              </button>

              <div className="flex space-x-4">
                {course.modules.findIndex(m => m._id === moduleId) > 0 && (
                  <button
                    onClick={() => {
                      const currentIndex = course.modules.findIndex(m => m._id === moduleId);
                      const prevModule = course.modules[currentIndex - 1];
                      navigate(`/courses/${courseId}/modules/${prevModule._id}`);
                    }}
                    className="btn btn-secondary"
                  >
                    Previous Module
                  </button>
                )}

                {course.modules.findIndex(m => m._id === moduleId) < course.modules.length - 1 ? (
                  <button
                    onClick={handleModuleComplete}
                    className="btn btn-primary"
                  >
                    Complete & Continue
                  </button>
                ) : (
                  <button
                    onClick={handleModuleComplete}
                    className="btn btn-primary"
                  >
                    Complete Course
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonView; 