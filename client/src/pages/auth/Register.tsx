import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-hot-toast';
import { register, clearError } from '../../store/slices/authSlice';
import type { RootState } from '../../types';
import type { AppDispatch } from '../../store';

const registerSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, 'Name must be at least 2 characters')
    .required('Name is required'),
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
  role: Yup.string()
    .oneOf(['student', 'instructor'], 'Invalid role')
    .required('Role is required'),
});

const Register = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, loading, error } = useSelector((state: RootState) => state.auth);

  const formik = useFormik({
    initialValues: {
      name: '',
      email: '',
      password: '',
      role: 'student',
    },
    validationSchema: registerSchema,
    onSubmit: async (values) => {
      try {
        await dispatch(register(values)).unwrap();
        toast.success('Registration successful!');
      } catch (err) {
        toast.error(error || 'Registration failed');
      }
    },
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
    return () => {
      dispatch(clearError());
    };
  }, [isAuthenticated, navigate, dispatch]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
              sign in to your account
            </Link>
          </p>
        </div>

        <form onSubmit={formik.handleSubmit} className="mt-8 space-y-6">
          <div className="rounded-md shadow-sm space-y-4">
            <div className="form-group">
              <label htmlFor="name" className="form-label">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                {...formik.getFieldProps('name')}
                className="input"
                placeholder="Enter your full name"
              />
              {formik.touched.name && formik.errors.name && (
                <div className="form-error">{formik.errors.name}</div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                {...formik.getFieldProps('email')}
                className="input"
                placeholder="Enter your email"
              />
              {formik.touched.email && formik.errors.email && (
                <div className="form-error">{formik.errors.email}</div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <input
                id="password"
                type="password"
                {...formik.getFieldProps('password')}
                className="input"
                placeholder="Enter your password"
              />
              {formik.touched.password && formik.errors.password && (
                <div className="form-error">{formik.errors.password}</div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="role" className="form-label">
                Register as
              </label>
              <select
                id="role"
                {...formik.getFieldProps('role')}
                className="input"
              >
                <option value="student">Student</option>
                <option value="instructor">Instructor</option>
              </select>
              {formik.touched.role && formik.errors.role && (
                <div className="form-error">{formik.errors.role}</div>
              )}
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading || !formik.isValid}
              className="btn btn-primary w-full flex justify-center items-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;