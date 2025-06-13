import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-2xl font-bold text-primary-600">
            LMS
          </Link>

          <div className="flex items-center space-x-4">
            <Link to="/courses" className="text-gray-600 hover:text-primary-600">
              Courses
            </Link>

            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="text-gray-600 hover:text-primary-600">
                  Dashboard
                </Link>
                {user?.role === 'instructor' && (
                  <Link
                    to="/create-course"
                    className="text-gray-600 hover:text-primary-600"
                  >
                    Create Course
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-600 hover:text-primary-600"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 