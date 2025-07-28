import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Menu, X, User, LogIn, LogOut, Upload, Home, Info, Clapperboard, 
    Crown, LayoutDashboard, ChevronDown, Film 
} from 'lucide-react';

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const profileRef = useRef(null);

  // Close menus on route change
  useEffect(() => {
    setMenuOpen(false);
    setProfileOpen(false);
  }, [location]);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileRef]);

  // --- Styling Classes ---
  const navLinkBaseClasses = "relative flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 ease-in-out";
  const linkClass = ({ isActive }) => `${navLinkBaseClasses} ${isActive ? 'bg-pink-500 text-white shadow-lg' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`;
  const adminLinkClass = ({ isActive }) => `${navLinkBaseClasses} ${isActive ? 'bg-yellow-500 text-white shadow-lg' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`;

  // --- Navigation Items Configuration ---
  const allNavLinks = [
    { to: "/", text: "Home", icon: <Home size={18} />, className: linkClass, show: 'always' },
    { to: "/about", text: "About", icon: <Info size={18} />, className: linkClass, show: 'always' },
    { to: "/catalogue", text: "Catalogue", icon: <Clapperboard size={18} />, className: linkClass, show: 'recruiter_or_admin' },
    // CORRECTED: A single upload link for all creative roles, pointing to /upload
    { to: "/upload", text: "Create/Upload", icon: <Upload size={18} />, className: linkClass, show: 'creative' },
    { to: "/admin/dashboard", text: "Admin Panel", icon: <Crown size={18} />, className: adminLinkClass, show: 'admin' }
  ];

  const creativeRoles = ['model', 'photographer', 'editor'];

  const navItems = allNavLinks.filter(link => {
    if (link.show === 'always') return true;
    if (!isAuthenticated) return false;
    
    const userRole = user.role;
    switch (link.show) {
        case 'recruiter_or_admin':
            return userRole === 'recruiter' || userRole === 'admin';
        case 'creative':
            return creativeRoles.includes(userRole);
        case 'admin':
            return userRole === 'admin';
        default:
            return false;
    }
  });

  return (
    <nav className="bg-gray-800/90 backdrop-blur-md text-white shadow-2xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          <NavLink to="/" className="text-3xl font-bold tracking-wider text-white transition-colors duration-300 hover:text-pink-400">
             Drippn's<span className="text-pink-400">Studio</span>
          </NavLink>

          {/* Desktop Links */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            {navItems.map(item => (
              <NavLink key={item.to} to={item.to} className={item.className}>
                {item.icon}<span>{item.text}</span>
              </NavLink>
            ))}
          </div>

          {/* Desktop Auth Section */}
          <div className="hidden md:flex items-center space-x-3">
            {isAuthenticated ? (
              <div className="relative" ref={profileRef}>
                <button onClick={() => setProfileOpen(!profileOpen)} className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-700">
                  <User size={18} />
                  <span>Hi, {user.name}</span>
                  <ChevronDown size={16} className={`transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-48 bg-gray-700 rounded-md shadow-lg z-20"
                    >
                      <div className="py-1">
                        <NavLink to="/profile" className="flex items-center gap-3 w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-600">
                           <LayoutDashboard size={16} /> My Dashboard
                        </NavLink>
                        <button onClick={logout} className="flex items-center gap-3 w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-600">
                           <LogOut size={16} /> Logout
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <>
                <NavLink to="/login" className={linkClass}><LogIn size={18} /><span>Login</span></NavLink>
                <NavLink to="/register" className={`${navLinkBaseClasses} bg-pink-500 text-white hover:bg-pink-600`}><span>Register</span></NavLink>
              </>
            )}
          </div>

          {/* Hamburger Icon */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700">
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="md:hidden overflow-hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navItems.map(item => (
                <NavLink key={item.to} to={item.to} className={`${item.className} block`} onClick={() => setMenuOpen(false)}>
                  {item.icon}<span>{item.text}</span>
                </NavLink>
              ))}
              <div className="border-t border-gray-700 my-2"></div>
              {isAuthenticated ? (
                <>
                  <NavLink to="/profile" className={`${linkClass({isActive: false})} w-full block`} onClick={() => setMenuOpen(false)}>
                    <LayoutDashboard size={18} /><span>My Dashboard</span>
                  </NavLink>
                  <button onClick={logout} className={`${navLinkBaseClasses} bg-red-500 text-white hover:bg-red-600 w-full justify-center`}>
                    <LogOut size={18} /><span>Logout</span>
                  </button>
                </>
              ) : (
                <>
                  <NavLink to="/login" className={`${linkClass({isActive: false})} w-full block`} onClick={() => setMenuOpen(false)}>
                    <LogIn size={18} /><span>Login</span>
                  </NavLink>
                  <NavLink to="/register" className={`${linkClass({isActive: false})} w-full block justify-center bg-pink-500 hover:bg-pink-600`} onClick={() => setMenuOpen(false)}>
                    <span>Register</span>
                  </NavLink>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
