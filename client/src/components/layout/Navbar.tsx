import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { type RootState } from '../../store';
import { logout } from '../../store/slices/authSlice';

const Navbar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <>
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-2xl font-bold text-primary-600">
            LMS Platform
          </Link>

          <div className="flex items-center space-x-4">
            <Link to="/courses" className="text-gray-700 hover:text-primary-600">
              Courses
            </Link>

            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="text-gray-700 hover:text-primary-600">
                  Dashboard
                </Link>
                {user?.role === 'instructor' && (
                  <Link to="/courses/create" className="text-gray-700 hover:text-primary-600">
                    Create Course
                  </Link>
                )}
                <div className="flex items-center space-x-4">
                  <span className="text-gray-700">
                    Welcome, {user?.name}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="btn btn-secondary"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login" className="btn btn-primary">
                  Login
                </Link>
                <Link to="/register" className="btn btn-secondary">
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
    </>
  );
};

export default Navbar; 