import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../Context/AuthContext';
import { Mail, Key, CheckCircle, AlertTriangle, Loader, Eye, EyeOff } from 'lucide-react';

// Custom hook for handling notifications
const useNotification = () => {
  const [notification, setNotification] = useState(null);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  return { notification, showNotification };
};

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { notification, showNotification } = useNotification();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('https://modelconnect-api.onrender.com/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Use the login function from AuthContext
        login(data.user, data.token);
        showNotification('Login successful!', 'success');
        // Redirect to home page after a short delay
        setTimeout(() => {
            navigate('/');
        }, 1500);
      } else {
        throw new Error(data.message || 'Login failed');
      }
    } catch (error) {
      showNotification(error.message, 'error');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Notification Popup */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.3 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
            className={`fixed top-24 right-5 z-50 flex items-center p-4 rounded-lg shadow-lg text-white ${
              notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
            }`}
          >
            {notification.type === 'success' ? <CheckCircle className="mr-3" /> : <AlertTriangle className="mr-3" />}
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="relative w-full max-w-4xl flex bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Image Section */}
          <div className="hidden lg:block w-1/2">
            <img
              src="https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=800&q=80"
              alt="Model looking at camera"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Form Section */}
          <div className="w-full lg:w-1/2 p-8 md:p-12 flex items-center">
            <motion.div
              className="w-full"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl font-bold text-gray-800 mb-2">Welcome Back</h2>
              <p className="text-gray-500 mb-8">Log in to continue your journey.</p>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email Input */}
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 text-gray-900 border border-gray-300 rounded-lg focus:ring-pink-500 focus:border-pink-500 transition"
                    required
                  />
                </div>

                {/* Password Input */}
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 text-gray-900 border border-gray-300 rounded-lg focus:ring-pink-500 focus:border-pink-500 transition"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                
                <div className="text-right text-sm">
                    <Link to="/forgot-password" className="font-medium text-pink-500 hover:underline">
                        Forgot Password?
                    </Link>
                </div>
                
                {/* Submit Button */}
                <button 
                  type="submit" 
                  className="w-full flex justify-center items-center bg-pink-500 hover:bg-pink-600 text-white p-3 rounded-lg font-bold text-lg transition-all duration-300 disabled:bg-pink-300"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader className="animate-spin mr-2" />
                      <span>Logging In...</span>
                    </>
                  ) : (
                    'Login'
                  )}
                </button>

                <p className="text-center text-sm text-gray-500">
                  Don't have an account?{' '}
                  <Link to="/register" className="font-semibold text-pink-500 hover:underline">
                    Sign up
                  </Link>
                </p>
              </form>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
