import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../Context/AuthContext';
import { UploadCloud, User, Link as LinkIcon, CheckCircle, AlertTriangle, Loader, Image as ImageIcon, Trash2, Instagram } from 'lucide-react';

// Reusable custom hook for handling notifications
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

const ModelUpload = () => {
  const [name, setName] = useState('');
  const [gender, setGender] = useState('');
  const [bio, setBio] = useState('');
  const [portfolio, setPortfolio] = useState('');
  const [instagramId, setInstagramId] = useState('');
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [galleryPreviews, setGalleryPreviews] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { notification, showNotification } = useNotification();
  const { token, user } = useAuth();

  const handleGalleryChange = (e) => {
    const files = Array.from(e.target.files);
    if (galleryFiles.length + files.length > 8) {
      showNotification('You can upload a maximum of 8 images.', 'error');
      return;
    }
    setGalleryFiles(prev => [...prev, ...files]);
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setGalleryPreviews(prev => [...prev, ...newPreviews]);
  };

  const handleRemoveImage = (index) => {
    setGalleryFiles(files => files.filter((_, i) => i !== index));
    setGalleryPreviews(previews => previews.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (galleryFiles.length < 4) {
      showNotification('You must upload at least 4 images to create a profile.', 'error');
      return;
    }
    setIsLoading(true);

    const formData = new FormData();
    formData.append('name', name);
    formData.append('gender', gender);
    formData.append('bio', bio);
    formData.append('portfolio', portfolio);
    formData.append('instagram_id', instagramId);
    formData.append('role', user.role);
    
    // The first image uploaded will be the main profile picture
    formData.append('mainImage', galleryFiles[0]);
    // Append all selected images to the gallery field
    galleryFiles.forEach(file => {
        formData.append('galleryImages', file);
    });

    try {
      const res = await fetch('https://modelconnect-api.onrender.com/api/models', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      showNotification('Profile created successfully!', 'success');
      // Reset form state completely
      setName(''); setGender(''); setBio(''); setPortfolio(''); setInstagramId('');
      setGalleryFiles([]); setGalleryPreviews([]);
      e.target.reset();
    } catch (error) {
      showNotification(`Creation failed: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
            className={`fixed top-24 right-5 z-50 flex items-center p-4 rounded-lg shadow-lg text-white ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}
          >
            {notification.type === 'success' ? <CheckCircle className="mr-3" /> : <AlertTriangle className="mr-3" />}
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-100 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-lg p-8 rounded-2xl shadow-2xl border border-white space-y-6">
            <div className="text-center">
              <User className="mx-auto text-pink-500 mb-4" size={48} />
              <h2 className="text-4xl font-bold text-gray-800">Create Your Model Profile</h2>
              <p className="text-gray-500 mt-2">Make a stunning first impression. Your first uploaded image will be your main photo.</p>
            </div>
            
            <div className="space-y-2">
                <label className="font-medium text-gray-700">Your Portfolio (4-8 images required)</label>
                <div className="grid grid-cols-4 gap-4">
                    {galleryPreviews.map((preview, index) => (
                        <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border-2 border-gray-200">
                            <img src={preview} alt="preview" className="w-full h-full object-cover"/>
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                <button type="button" onClick={() => handleRemoveImage(index)} className="text-white p-2 bg-red-500/80 rounded-full hover:bg-red-600 transition"><Trash2 size={16}/></button>
                            </div>
                            {index === 0 && <div className="absolute top-1 left-1 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">Main</div>}
                        </div>
                    ))}
                    {galleryFiles.length < 8 && (
                        <label htmlFor="gallery-upload" className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100 transition">
                            <ImageIcon className="w-8 h-8 text-gray-400"/>
                            <span className="text-xs text-gray-500 mt-1">Add Image</span>
                            <input id="gallery-upload" type="file" className="sr-only" multiple accept="image/*" onChange={handleGalleryChange} />
                        </label>
                    )}
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2"><label htmlFor="name" className="font-medium text-gray-700">Full Name</label><input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-3 text-gray-900 rounded-lg bg-gray-100/50 border focus:border-pink-500" required /></div>
              <div className="space-y-2"><label htmlFor="gender" className="font-medium text-gray-700">Gender</label><select id="gender" value={gender} onChange={(e) => setGender(e.target.value)} className="w-full p-3 text-gray-900 rounded-lg bg-gray-100/50 border focus:border-pink-500" required><option value="" disabled>Select...</option><option>Male</option><option>Female</option><option>Other</option></select></div>
              <div className="md:col-span-2 space-y-2"><label htmlFor="bio" className="font-medium text-gray-700">Bio</label><textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} className="w-full p-3 text-gray-900 rounded-lg bg-gray-100/50 border focus:border-pink-500 min-h-[100px]" required /></div>
              <div className="space-y-2"><label htmlFor="portfolio" className="font-medium text-gray-700">Portfolio URL</label><div className="relative"><LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} /><input id="portfolio" type="url" value={portfolio} onChange={(e) => setPortfolio(e.target.value)} className="w-full pl-10 p-3 text-gray-900 rounded-lg bg-gray-100/50 border focus:border-pink-500" /></div></div>
              <div className="space-y-2"><label htmlFor="instagram" className="font-medium text-gray-700">Instagram Handle</label><div className="relative"><Instagram className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} /><input id="instagram" type="text" value={instagramId} onChange={(e) => setInstagramId(e.target.value)} className="w-full pl-10 p-3 text-gray-900 rounded-lg bg-gray-100/50 border focus:border-pink-500" /></div></div>
            </div>

            <button type="submit" className="w-full flex justify-center items-center bg-pink-500 hover:bg-pink-600 text-white p-4 rounded-lg font-bold text-lg transition disabled:bg-pink-300" disabled={isLoading}>{isLoading ? <><Loader className="animate-spin mr-2" /><span>Creating Profile...</span></> : 'Submit Profile'}</button>
          </form>
        </motion.div>
      </div>
    </>
  );
};

export default ModelUpload;
