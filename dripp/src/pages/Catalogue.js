import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ExternalLink, Frown, AlertTriangle, Sparkles, User, Video, Camera } from 'lucide-react';
import { useAuth } from '../Context/AuthContext';

const Catalogue = () => {
  const [catalogueData, setCatalogueData] = useState({ models: [], photographers: [], editors: [] });
  const [activeTab, setActiveTab] = useState('models');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const { token } = useAuth();

  useEffect(() => {
    const fetchDataForCatalogue = async (endpoint, key) => {
      try {
        const res = await fetch(`https://modelconnect-api.onrender.com/api/${endpoint}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        // Get the response as text first to avoid JSON parsing errors on HTML pages
        const textResponse = await res.text();

        if (!res.ok) {
          let errorMessage;
          try {
            // Try to parse it as a JSON error message from the server
            const errorData = JSON.parse(textResponse);
            errorMessage = errorData.message || `Failed to fetch ${key}.`;
          } catch (e) {
            // If parsing fails, it's an HTML error page.
            errorMessage = `Server returned a non-JSON error (Status: ${res.status}). Check the backend logs for the /api/${endpoint} route.`;
          }
          throw new Error(errorMessage);
        }
        
        // If the response was OK, parse the text as JSON
        return JSON.parse(textResponse);

      } catch (err) {
        console.error(`Error fetching ${key}:`, err);
        setError(err.message);
        return []; // Return an empty array on error to prevent crashes
      }
    };

    const loadAllData = async () => {
      setLoading(true);
      setError(null);
      if (!token) {
        setError("You must be logged in to view the catalogue.");
        setLoading(false);
        return;
      }
      
      const [modelData, editorData] = await Promise.all([
        fetchDataForCatalogue('models', 'models'),
        fetchDataForCatalogue('editors/videos', 'editors')
      ]);

      // If there was an error during fetching, stop here. The error is already set.
      if(error) {
        setLoading(false);
        return;
      }

      setCatalogueData({
        models: modelData.filter(p => p.role === 'model'),
        photographers: modelData.filter(p => p.role === 'photographer'),
        editors: editorData
      });

      setLoading(false);
    };

    loadAllData();
  }, [token]);

  const filteredData = useMemo(() => {
    const data = catalogueData[activeTab] || [];
    if (!searchTerm) return data;
    
    return data.filter(item => {
        const name = item.name || item.title || item.editor_name;
        const bio = item.bio || item.description;
        return name.toLowerCase().includes(searchTerm.toLowerCase()) || (bio && bio.toLowerCase().includes(searchTerm.toLowerCase()));
    });
  }, [catalogueData, activeTab, searchTerm]);

  const getGenderClass = (gender) => {
    switch (gender) {
        case 'Male': return 'bg-blue-100 text-blue-800 border border-blue-200';
        case 'Female': return 'bg-pink-100 text-pink-800 border border-pink-200';
        default: return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const tabs = [
    { key: 'models', label: 'Models', icon: <User size={16}/> },
    { key: 'photographers', label: 'Photographers', icon: <Camera size={16}/> },
    { key: 'editors', label: 'Editors', icon: <Video size={16}/> }
  ];

  const LoadingSpinner = () => <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-pink-500"></div></div>;
  const ErrorDisplay = ({ message }) => <div className="text-center py-20"><AlertTriangle className="mx-auto text-red-500" size={64} /><h3 className="mt-4 text-2xl font-semibold text-gray-800">An Error Occurred</h3><p className="mt-2 text-gray-500">{message}</p></div>;
  const NoResultsDisplay = () => <div className="text-center py-20 col-span-full"><Frown className="mx-auto text-gray-400" size={64} /><h3 className="mt-4 text-2xl font-semibold text-gray-800">No Results Found</h3><p className="mt-2 text-gray-500">There are no profiles to display in this category.</p></div>;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <header className="bg-white shadow-sm sticky top-20 md:top-0 z-40">
        <div className="max-w-7xl mx-auto pt-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-gray-900">Talent Catalogue</h1>
          <p className="mt-1 text-gray-500">Discover the perfect talent for your next project.</p>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    {tabs.map(tab => (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`${activeTab === tab.key ? 'border-pink-500 text-pink-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} flex items-center gap-2 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}>
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </nav>
            </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="relative w-full md:w-1/2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input type="text" placeholder={`Search for ${activeTab}...`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        {loading ? <LoadingSpinner /> : error ? <ErrorDisplay message={error} /> : (
          <motion.div
            key={activeTab}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          >
            {filteredData.length > 0 ? filteredData.map(item => {
                if (activeTab === 'editors') {
                    return (
                        <motion.div key={item.id} className="bg-white rounded-xl shadow-lg overflow-hidden border">
                            <div className="relative aspect-video bg-black"><video src={item.video_url} controls className="w-full h-full object-cover"></video></div>
                            <div className="p-5">
                                <h3 className="text-xl font-bold text-gray-900 truncate">{item.title}</h3>
                                <p className="text-sm font-medium text-gray-500">by {item.editor_name}</p>
                                <p className="text-gray-600 text-sm mt-2 h-12 overflow-hidden">{item.description}</p>
                            </div>
                        </motion.div>
                    );
                } else {
                    return (
                         <motion.div key={item.id} className="bg-white rounded-xl shadow-lg group transform hover:-translate-y-2 transition-all duration-300 ease-in-out hover:shadow-2xl border border-transparent hover:border-pink-200">
                            <div className="relative overflow-hidden rounded-t-xl">
                                <img src={item.image} alt={item.name} className="w-full h-80 object-cover transition-all duration-500 group-hover:scale-110" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                                <div className="absolute bottom-0 left-0 p-4 w-full">
                                    <h3 className="text-2xl font-bold text-white tracking-tight">{item.name}</h3>
                                    <span className={`text-xs font-bold px-2 py-1 rounded-full mt-1 inline-block ${getGenderClass(item.gender)}`}>{item.gender}</span>
                                </div>
                            </div>
                            <div className="p-5">
                                <p className="text-gray-600 text-sm mb-4 h-16 overflow-hidden">{item.bio}</p>
                                <Link to={`/profile/${item.user_id}`} className="flex items-center justify-center w-full px-4 py-2 bg-pink-500 text-white rounded-lg font-semibold hover:bg-pink-600 transition text-sm">
                                    View Full Profile <Sparkles className="ml-2" size={14} />
                                </Link>
                            </div>
                        </motion.div>
                    );
                }
            }) : <NoResultsDisplay />}
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default Catalogue;
