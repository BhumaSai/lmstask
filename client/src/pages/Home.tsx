import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { type RootState } from '../store';

const Home = () => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-primary-600 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Transform Your Learning Journey
            </h1>
            <p className="text-xl mb-8">
              Access high-quality courses, learn from experienced instructors, and advance your career with our comprehensive learning platform.
            </p>
            {!isAuthenticated && (
              <div className="space-x-4">
                <Link to="/register" className="btn bg-white text-primary-600 hover:bg-gray-100">
                  Get Started
                </Link>
                <Link to="/login" className="btn bg-primary-700 text-white hover:bg-primary-800">
                  Login
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Our Platform?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Expert-Led Courses</h3>
              <p className="text-gray-600">Learn from industry professionals and gain practical knowledge.</p>
            </div>
            <div className="text-center">
              <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Self-Paced Learning</h3>
              <p className="text-gray-600">Study at your own pace and track your progress effectively.</p>
            </div>
            <div className="text-center">
              <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Verified Certificates</h3>
              <p className="text-gray-600">Earn recognized certificates upon course completion.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-100 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-8">Ready to Start Learning?</h2>
          <Link to="/courses" className="btn btn-primary">
            Browse Courses
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home; 