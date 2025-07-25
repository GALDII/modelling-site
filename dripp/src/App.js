import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './Context/AuthContext';

// Import Components and Pages
import Navbar from './Components/NavBar';
import Home from './pages/Home';
import Catalogue from './pages/Catalogue';
import About from './pages/About';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import ModelUpload from './pages/ModelUpload';
import PhotographerUpload from './pages/PhotographerUpload';
import AdminDashboard from './pages/AdminDashboard'; 
import PublicProfile from './pages/PublicProfile';
import EditorUpload from './pages/EditorUpload';

// New Controller to handle which upload page to show
const UploadController = () => {
    const { user } = useAuth();
    switch (user?.role) {
        case 'model':
            return <ModelUpload />;
        case 'photographer':
            return <PhotographerUpload />;
        case 'editor':
            return <EditorUpload />;
        default:
            // Redirect if the user doesn't have a creative role with an upload page
            return <Navigate to="/profile" replace />;
    }
};

const ProtectedRoute = ({ allowedRoles }) => {
    const { isAuthenticated, user } = useAuth();
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
    return <Outlet />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <main>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile/:userId" element={<PublicProfile />} />

            {/* General Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/profile" element={<Profile />} />
            </Route>

            {/* CORRECTED: Unified upload route for all creative roles */}
            <Route element={<ProtectedRoute allowedRoles={['model', 'photographer', 'editor']} />}>
              <Route path="/upload" element={<UploadController />} />
            </Route>
            
            {/* Recruiter & Admin Only Routes */}
            <Route element={<ProtectedRoute allowedRoles={['recruiter', 'admin']} />}>
                <Route path="/catalogue" element={<Catalogue />} />
            </Route>
            
            {/* Admin Only Routes */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
            </Route>

            {/* 404 Not Found Page */}
            <Route path="*" element={ <div className="text-center mt-20 p-4"> <h1 className="text-4xl font-bold text-pink-500">404</h1> <p className="text-lg text-gray-400">Page Not Found</p> </div> } />
          </Routes>
        </main>
      </Router>
    </AuthProvider>
  );
}

export default App;
