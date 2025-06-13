import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Provider } from 'react-redux';
import { store } from './store';

// Layout
import Layout from './components/layout/Layout';
import PrivateRoute from './components/auth/PrivateRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import CourseList from './pages/courses/CourseList';
import CourseDetails from './pages/courses/CourseDetails';
import Dashboard from './pages/dashboard/Dashboard';
import CreateCourse from './pages/courses/CreateCourse';
import EditCourse from './pages/courses/EditCourse';
import LessonView from './pages/lessons/LessonView';

function App() {
  return (
    <Provider store={store}>
      <Router>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="courses" element={<CourseList />} />
            <Route path="courses/:id" element={<CourseDetails />} />
            
            {/* Protected Routes */}
            <Route element={<PrivateRoute />}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="courses/create" element={<CreateCourse />} />
              <Route path="courses/edit/:id" element={<EditCourse />} />
              <Route path="courses/:courseId/lessons/:lessonId" element={<LessonView />} />
            </Route>
          </Route>
        </Routes>
      </Router>
    </Provider>
  );
}

export default App;
