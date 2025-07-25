import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../Context/AuthContext'; // <-- Import useAuth
import { Loader, AlertTriangle, Mail, Link as LinkIcon, ArrowLeft, Video, Instagram } from 'lucide-react';

const PublicProfile = () => {
    const { userId } = useParams(); // Get the user ID from the URL
    const [profile, setProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const { token } = useAuth(); // <-- Get the token from your AuthContext

    useEffect(() => {
        const fetchPublicProfile = async () => {
            setIsLoading(true);
            setError(null);

            // If there's no token, we can't make an authenticated request.
            if (!token) {
                setError("Authentication is required to view profiles.");
                setIsLoading(false);
                return;
            }

            try {
                // CORRECTED: Added the Authorization header to the fetch request
                const res = await fetch(`https://modelconnect-api.onrender.com/api/profile/${userId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.message || 'Could not find this profile.');
                }
                const data = await res.json();
                setProfile(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPublicProfile();
    }, [userId, token]); // <-- Add token to the dependency array

    const getGenderClass = (gender) => {
        switch (gender) {
            case 'Male': return 'bg-blue-100 text-blue-800';
            case 'Female': return 'bg-pink-100 text-pink-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex justify-center items-center">
                <Loader className="animate-spin text-pink-500" size={48} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center text-center p-6">
                <AlertTriangle className="mx-auto text-red-500 mb-4" size={64} />
                <h2 className="mt-4 text-3xl font-bold text-gray-800">Profile Not Found</h2>
                <p className="text-gray-600 my-4 max-w-md">{error}</p>
                <Link to="/catalogue" className="inline-flex items-center justify-center px-6 py-3 bg-pink-600 text-white rounded-lg font-semibold shadow-lg hover:bg-pink-700">
                    <ArrowLeft size={18} className="mr-2" />
                    Back to Catalogue
                </Link>
            </div>
        );
    }

    // Determine the theme based on the user's role
    const isPhotographer = profile.role === 'photographer';
    const themeColor = isPhotographer ? 'blue' : 'pink';

    return (
        <div className={`min-h-screen bg-gray-50`}>
            <motion.div 
                className="max-w-6xl mx-auto p-4 md:p-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.7 }}
            >
                {/* Header Section */}
                <div className="md:flex gap-8 items-center bg-white p-8 rounded-2xl shadow-lg">
                    <div className="md:w-1/3 text-center md:text-left">
                        <img 
                            src={`https://modelconnect-api.onrender.com/uploads/${profile.image}`}
                            alt={profile.name}
                            className={`w-48 h-48 rounded-full mx-auto object-cover ring-4 ${isPhotographer ? 'ring-blue-200' : 'ring-pink-200'}`}
                        />
                    </div>
                    <div className="md:w-2/3 mt-6 md:mt-0">
                        <h1 className="text-5xl font-bold text-gray-900">{profile.name}</h1>
                        <span className={`text-sm font-bold px-3 py-1 rounded-full mt-2 inline-block ${getGenderClass(profile.gender)}`}>
                            {profile.gender}
                        </span>
                        <p className="text-gray-600 mt-4 text-lg">{profile.bio}</p>
                        <div className="flex gap-4 mt-6 flex-wrap">
                            <button className={`flex items-center justify-center px-6 py-3 bg-${themeColor}-600 text-white rounded-lg font-semibold shadow-lg hover:bg-${themeColor}-700 transition`}>
                                <Mail size={18} className="mr-2"/> Contact Talent
                            </button>
                            {profile.portfolio && (
                                <a href={profile.portfolio} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center px-6 py-3 bg-gray-100 text-gray-800 rounded-lg font-semibold hover:bg-gray-200 transition">
                                    <LinkIcon size={18} className="mr-2"/> View Portfolio
                                </a>
                            )}
                             {profile.instagram_id && (
                                <a href={`https://instagram.com/${profile.instagram_id}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center px-6 py-3 bg-gray-100 text-gray-800 rounded-lg font-semibold hover:bg-gray-200 transition">
                                    <Instagram size={18} className="mr-2"/> Instagram
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                {/* UPDATED: Conditionally render the sample video if it exists for photographers */}
                {isPhotographer && profile.sample_video_url && (
                    <div className="mt-12 bg-white p-8 rounded-2xl shadow-lg">
                        <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3"><Video size={28}/> Sample Work</h2>
                        <div className="rounded-xl overflow-hidden shadow-inner">
                            <video src={`https://modelconnect-api.onrender.com/uploads/${profile.sample_video_url}`} controls className="w-full"></video>
                        </div>
                    </div>
                )}

                {/* Gallery Section */}
                <div className="mt-12 bg-white p-8 rounded-2xl shadow-lg">
                    <h2 className="text-3xl font-bold text-gray-800 mb-6">Photo Gallery</h2>
                    {profile.gallery && profile.gallery.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {profile.gallery.map((img) => (
                                <motion.div 
                                    key={img.id}
                                    className="relative aspect-square rounded-xl overflow-hidden shadow-md"
                                    whileHover={{ scale: 1.05 }}
                                    transition={{ type: 'spring', stiffness: 300 }}
                                >
                                    <img 
                                        src={`https://modelconnect-api.onrender.com/uploads/${img.image_url}`}
                                        alt={`Gallery image for ${profile.name}`}
                                        className="w-full h-full object-cover"
                                    />
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500">No gallery images have been uploaded yet.</p>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default PublicProfile;
