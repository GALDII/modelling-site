import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../Context/AuthContext';
import { User, Edit, Save, X, ImagePlus, Trash2, Star, Loader, CheckCircle, AlertTriangle, UserPlus, Film, Video, Camera, Instagram, Link as LinkIcon } from 'lucide-react';

// Reusable custom hook for handling notifications
const useNotification = () => {
  const [notification, setNotification] = useState(null);
  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  }, []);
  return { notification, showNotification };
};

// --- Editor Dashboard Component ---
const EditorDashboard = ({ videos, fetchVideos, showNotification }) => {
    const { token } = useAuth();
    const handleDelete = async (videoId) => {
        if (window.confirm('Are you sure you want to delete this video? This action cannot be undone.')) {
            try {
                const res = await fetch(`https://modelconnect-api.onrender.com/api/editor/videos/${videoId}`, {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.message);
                showNotification('Video deleted successfully!', 'success');
                fetchVideos();
            } catch (error) {
                showNotification(error.message, 'error');
            }
        }
    };
    return (
        <div className="p-4 md:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-4xl font-bold text-gray-800">Editor Dashboard</h1>
                    <p className="text-gray-500 mt-1">Manage your uploaded video portfolio.</p>
                </div>
                <Link to="/upload" className="flex items-center gap-2 bg-pink-500 text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-pink-600 transition w-full sm:w-auto justify-center">
                    <Film size={16} /> Upload New Video
                </Link>
            </div>
            {videos.length > 0 ? (
                <motion.div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {videos.map(video => (
                        <motion.div key={video.id} className="bg-white rounded-xl shadow-lg overflow-hidden border" layout initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring' }}>
                            <div className="relative aspect-video bg-black"><video src={`https://modelconnect-api.onrender.com/uploads/${video.video_url}`} controls className="w-full h-full object-cover"></video></div>
                            <div className="p-5">
                                <h3 className="text-xl font-bold text-gray-900 truncate">{video.title}</h3>
                                <p className="text-gray-600 text-sm mt-1 h-10 overflow-hidden">{video.description}</p>
                                <div className="mt-4 flex justify-end">
                                    <button onClick={() => handleDelete(video.id)} className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700 font-semibold transition-colors"><Trash2 size={14}/> Delete</button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            ) : (
                <div className="text-center py-20 border-2 border-dashed rounded-lg mt-8"><Video size={48} className="mx-auto text-gray-400"/><h3 className="mt-4 text-xl font-semibold text-gray-700">No videos uploaded yet.</h3><p className="text-gray-500 mt-1">Click the button above to upload your first video.</p></div>
            )}
        </div>
    );
};

// --- Model/Photographer Profile Component ---
const CreativeProfile = ({ profile, fetchProfile, showNotification }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState(profile);
    const [galleryFiles, setGalleryFiles] = useState([]);
    const [galleryPreviews, setGalleryPreviews] = useState([]);
    const { token } = useAuth();
    
    const handleEdit = () => setIsEditing(true);
    const handleCancel = () => { setIsEditing(false); setGalleryFiles([]); setGalleryPreviews([]); setFormData(profile); };
    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleGalleryFileChange = (e) => {
        const files = Array.from(e.target.files);
        const currentImageCount = (profile?.gallery?.length || 0) + galleryFiles.length;
        if (currentImageCount + files.length > 8) {
          showNotification(`You can only upload ${8 - currentImageCount} more images.`, 'error');
          return;
        }
        setGalleryFiles(prev => [...prev, ...files]);
        const newPreviews = files.map(file => URL.createObjectURL(file));
        setGalleryPreviews(prev => [...prev, ...newPreviews]);
    };
    const handleRemoveNewFile = (index) => {
        setGalleryFiles(files => files.filter((_, i) => i !== index));
        setGalleryPreviews(previews => previews.filter((_, i) => i !== index));
    };
    const handleDeleteExistingImage = async (imageId) => {
        try {
          const res = await fetch(`https://modelconnect-api.onrender.com/api/models/my-profile/gallery/${imageId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
          const data = await res.json();
          if (!res.ok) throw new Error(data.message);
          showNotification('Image deleted!', 'success');
          fetchProfile();
        } catch (error) {
          showNotification(error.message, 'error');
        }
    };
    const handleSetMainImage = async (imageUrl) => {
        try {
          const res = await fetch('https://modelconnect-api.onrender.com/api/models/my-profile/main-image', { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`}, body: JSON.stringify({ imageUrl }) });
          const data = await res.json();
          if (!res.ok) throw new Error(data.message);
          showNotification('Main image updated!', 'success');
          fetchProfile();
        } catch (error) {
          showNotification(error.message, 'error');
        }
    };
    const handleSave = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (galleryFiles.length > 0) {
                const galleryUploadForm = new FormData();
                galleryFiles.forEach(file => galleryUploadForm.append('galleryImages', file));
                const galleryRes = await fetch('https://modelconnect-api.onrender.com/api/models/my-profile/gallery', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: galleryUploadForm });
                if (!galleryRes.ok) throw new Error((await galleryRes.json()).message);
            }
            const detailsRes = await fetch('https://modelconnect-api.onrender.com/api/models/my-profile', { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(formData) });
            if (!detailsRes.ok) throw new Error((await detailsRes.json()).message);
            showNotification('Profile saved successfully!', 'success');
            setIsEditing(false);
            setGalleryFiles([]);
            setGalleryPreviews([]);
            fetchProfile();
        } catch (error) {
            showNotification(error.message, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSave}>
            <div className="relative h-48 bg-gradient-to-r from-pink-50 to-rose-100">
                <div className="absolute -bottom-16 left-8"><div className="w-32 h-32 rounded-full ring-4 ring-white bg-gray-200 flex items-center justify-center overflow-hidden"><img src={`https://modelconnect-api.onrender.com/uploads/${profile.image}`} alt="Profile" className="w-full h-full object-cover" onError={(e) => { e.target.src = 'https://placehold.co/128x128/e2e8f0/4a5568?text=N/A'; }} /></div></div>
                <div className="absolute top-4 right-4">{!isEditing ? (<button type="button" onClick={handleEdit} className="flex items-center gap-2 bg-white text-gray-700 px-4 py-2 rounded-lg font-semibold shadow hover:bg-gray-100 transition"><Edit size={16} /> Edit Profile</button>) : (<div className="flex gap-2"><button type="submit" disabled={isSubmitting} className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-green-600 transition disabled:bg-green-300">{isSubmitting ? <Loader className="animate-spin" size={16}/> : <Save size={16}/>} Save</button><button type="button" onClick={handleCancel} className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-gray-600 transition"><X size={16} /> Cancel</button></div>)}</div>
            </div>
            <div className="pt-20 p-8 space-y-8">
                <div>{isEditing ? <input type="text" name="name" value={formData.name || ''} onChange={handleChange} className="text-4xl font-bold text-gray-800 border-b-2 border-gray-300 focus:border-pink-500 outline-none w-full" /> : <h1 className="text-4xl font-bold text-gray-800">{profile.name}</h1>}</div>
                <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Details</h3>
                        {isEditing ? (
                            <>
                                <div className="space-y-2"><label className="font-medium text-gray-700">Gender</label><select name="gender" value={formData.gender || ''} onChange={handleChange} className="p-2 rounded-lg bg-gray-100 w-full text-gray-800"><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option></select></div>
                                <div className="space-y-2"><label className="font-medium text-gray-700">Bio</label><textarea name="bio" value={formData.bio || ''} onChange={handleChange} className="p-2 rounded-lg bg-gray-100 w-full min-h-[120px] text-gray-800"/></div>
                                <div className="space-y-2"><label className="font-medium text-gray-700">Portfolio URL</label><input type="url" name="portfolio" value={formData.portfolio || ''} onChange={handleChange} className="p-2 rounded-lg bg-gray-100 w-full text-gray-800" placeholder="https://your-link.com"/></div>
                                <div className="space-y-2"><label className="font-medium text-gray-700">Instagram Handle</label><input type="text" name="instagram_id" value={formData.instagram_id || ''} onChange={handleChange} className="p-2 rounded-lg bg-gray-100 w-full text-gray-800" placeholder="yourhandle"/></div>
                            </>
                        ) : (
                            <>
                                <p className="text-gray-800"><strong>Gender:</strong> {profile.gender}</p>
                                <p className="text-gray-800"><strong>Bio:</strong> {profile.bio}</p>
                                <p className="text-gray-800"><strong>Portfolio:</strong> <a href={profile.portfolio} target="_blank" rel="noopener noreferrer" className="text-pink-500 hover:underline break-all">{profile.portfolio}</a></p>
                                <p className="text-gray-800"><strong>Instagram:</strong> <a href={`https://instagram.com/${profile.instagram_id}`} target="_blank" rel="noopener noreferrer" className="text-pink-500 hover:underline">@{profile.instagram_id}</a></p>
                            </>
                        )}
                    </div>
                    <div className="space-y-4">
                        {profile.role === 'photographer' && profile.sample_video_url && (
                            <>
                                <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Sample Video</h3>
                                <div className="rounded-lg overflow-hidden"><video src={`https://modelconnect-api.onrender.com/uploads/${profile.sample_video_url}`} controls className="w-full"></video></div>
                            </>
                        )}
                        <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Photo Gallery</h3>
                        <div className="grid grid-cols-3 gap-2">
                          {profile.gallery.map((img) => (
                            <div key={img.id} className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden">
                               <img src={`https://modelconnect-api.onrender.com/uploads/${img.image_url}`} alt={`Gallery`} className="w-full h-full object-cover"/>
                               {profile.image === img.image_url && <div className="absolute top-1 left-1 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1"><Star size={12}/> Main</div>}
                               {isEditing && (
                                 <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-1">
                                   {profile.image !== img.image_url && <button type="button" onClick={() => handleSetMainImage(img.image_url)} className="text-xs bg-green-500 text-white px-2 py-1 rounded w-full hover:bg-green-600">Set Main</button>}
                                   <button type="button" onClick={() => handleDeleteExistingImage(img.id)} className="text-xs bg-red-500 text-white px-2 py-1 rounded w-full hover:bg-red-600">Delete</button>
                                 </div>
                               )}
                            </div>
                          ))}
                          {galleryPreviews.map((preview, index) => (
                            <div key={index} className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden">
                               <img src={preview} alt={`Preview`} className="w-full h-full object-cover"/>
                               <button type="button" onClick={() => handleRemoveNewFile(index)} className="absolute top-1 right-1 bg-red-500/80 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"><Trash2 size={14}/></button>
                            </div>
                          ))}
                          {isEditing && (profile.gallery.length + galleryFiles.length) < 8 && (
                            <label className="aspect-square flex flex-col items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-200 transition">
                              <ImagePlus className="text-gray-400" size={24}/>
                              <span className="text-xs text-gray-500 mt-1">Add Photos</span>
                              <input type="file" className="sr-only" multiple accept="image/*" onChange={handleGalleryFileChange}/>
                            </label>
                          )}
                       </div>
                    </div>
                </div>
            </div>
        </form>
    );
};


// --- Main Profile Page (Controller) ---
const Profile = () => {
  const { user, token } = useAuth();
  const [profile, setProfile] = useState(null);
  const [editorVideos, setEditorVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { notification, showNotification } = useNotification();

  const fetchCreativeProfile = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('https://modelconnect-api.onrender.com/api/models/my-profile', { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 404) setProfile(null);
      else if (res.ok) setProfile(await res.json());
      else throw new Error('Could not fetch profile.');
    } catch (error) { showNotification(error.message, 'error'); }
  }, [token, showNotification]);

  const fetchEditorVideos = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('https://modelconnect-api.onrender.com/api/editor/my-videos', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setEditorVideos(await res.json());
      else throw new Error('Could not fetch videos.');
    } catch (error) { showNotification(error.message, 'error'); }
  }, [token, showNotification]);

  useEffect(() => {
    const loadData = async () => {
        setIsLoading(true);
        if (user?.role === 'editor') {
            await fetchEditorVideos();
        } else if (['model', 'photographer'].includes(user?.role)) {
            await fetchCreativeProfile();
        }
        setIsLoading(false);
    };
    if(user) loadData();
    else setIsLoading(false); // If no user, stop loading
  }, [user, fetchCreativeProfile, fetchEditorVideos]);

  if (isLoading) return <div className="min-h-screen bg-gray-50 flex justify-center items-center"><Loader className="animate-spin text-pink-500" size={48} /></div>;

  // Render correct dashboard based on role
  return (
    <>
      <AnimatePresence>
        {notification && <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className={`fixed top-24 right-5 z-50 flex items-center p-4 rounded-lg shadow-lg text-white ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}><CheckCircle className="mr-3" />{notification.message}</motion.div>}
      </AnimatePresence>
      <div className="min-h-screen bg-gray-50">
        <motion.div className="max-w-7xl mx-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {user?.role === 'editor' ? (
                <EditorDashboard videos={editorVideos} fetchVideos={fetchEditorVideos} showNotification={showNotification} />
            ) : user?.role === 'model' || user?.role === 'photographer' ? (
                profile ? (
                    <CreativeProfile profile={profile} fetchProfile={fetchCreativeProfile} showNotification={showNotification} />
                ) : (
                    <div className="min-h-screen flex flex-col justify-center items-center text-center p-6">
                        <UserPlus className="mx-auto text-pink-500 mb-4" size={64} />
                        <h2 className="mt-4 text-3xl font-bold text-gray-800">Your Profile Awaits!</h2>
                        <p className="text-gray-600 my-4 max-w-md">Create your professional profile now to be discovered.</p>
                        <Link to="/upload" className="inline-flex items-center justify-center px-8 py-3 bg-pink-600 text-white rounded-lg font-semibold shadow-lg hover:bg-pink-700">Create Your Profile</Link>
                    </div>
                )
            ) : (
                 <div className="min-h-screen flex flex-col justify-center items-center text-center p-6">
                    <AlertTriangle className="mx-auto text-yellow-500 mb-4" size={64} />
                    <h2 className="mt-4 text-3xl font-bold text-gray-800">Dashboard Not Applicable</h2>
                    <p className="text-gray-600 my-4 max-w-md">Your role does not have a dedicated dashboard view.</p>
                    <Link to="/" className="inline-flex items-center justify-center px-8 py-3 bg-gray-600 text-white rounded-lg font-semibold shadow-lg hover:bg-gray-700">Return to Home</Link>
                 </div>
            )}
        </motion.div>
      </div>
    </>
  );
};

export default Profile;
