import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../Context/AuthContext';
import { UploadCloud, User, Link as LinkIcon, CheckCircle, AlertTriangle, Loader, Camera, Video } from 'lucide-react';

const useNotification = () => {
  const [notification, setNotification] = useState(null);
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };
  return { notification, showNotification };
};

const PhotographerUpload = () => {
  const [name, setName] = useState('');
  const [gender, setGender] = useState('');
  const [bio, setBio] = useState('');
  const [portfolio, setPortfolio] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [videoPreview, setVideoPreview] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { notification, showNotification } = useNotification();
  const { token, user } = useAuth();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showNotification('Image file is too large (Max 5MB).', 'error');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };
  
  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        showNotification('Video file is too large (Max 50MB).', 'error');
        return;
      }
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageFile) {
      showNotification('A main profile picture is required.', 'error');
      return;
    }
    setIsLoading(true);

    const formData = new FormData();
    formData.append('name', name);
    formData.append('gender', gender);
    formData.append('bio', bio);
    formData.append('portfolio', portfolio);
    formData.append('mainImage', imageFile);
    if (videoFile) {
        formData.append('sampleVideo', videoFile);
    }
    formData.append('role', user.role);

    try {
      const res = await fetch('http://localhost:5000/api/models', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'An unknown error occurred.');
      
      showNotification('Profile created successfully!', 'success');
      setName(''); setGender(''); setBio(''); setPortfolio('');
      setImageFile(null); setVideoFile(null);
      setImagePreview(''); setVideoPreview('');
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
        {notification && <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className={`fixed top-24 right-5 z-50 flex items-center p-4 rounded-lg shadow-lg text-white ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}><CheckCircle className="mr-3" />{notification.message}</motion.div>}
      </AnimatePresence>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-xl space-y-6">
            <div className="text-center">
              <Camera className="mx-auto text-pink-500 mb-4" size={48} />
              <h2 className="text-4xl font-bold text-gray-800">Create Your Photographer Profile</h2>
              <p className="text-gray-500 mt-2">Showcase your portfolio and get discovered.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2"><label htmlFor="name" className="font-medium text-gray-700">Full Name</label><input id="name" type="text" placeholder="e.g., John Smith" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-3 text-gray-900 rounded-lg bg-gray-100 border border-transparent focus:bg-white focus:border-pink-500" required /></div>
              <div className="space-y-2"><label htmlFor="gender" className="font-medium text-gray-700">Gender</label><select id="gender" value={gender} onChange={(e) => setGender(e.target.value)} className="w-full p-3 text-gray-900 rounded-lg bg-gray-100 border border-transparent focus:bg-white focus:border-pink-500" required><option value="" disabled>Select Gender</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option></select></div>
              <div className="md:col-span-2 space-y-2"><label htmlFor="bio" className="font-medium text-gray-700">Bio / Specialty</label><textarea id="bio" placeholder="e.g., Fashion and portrait photographer based in New York..." value={bio} onChange={(e) => setBio(e.target.value)} className="w-full p-3 text-gray-900 rounded-lg bg-gray-100 border border-transparent focus:bg-white focus:border-pink-500 min-h-[100px]" required /></div>
              <div className="md:col-span-2 space-y-2"><label htmlFor="portfolio" className="font-medium text-gray-700">Portfolio URL (Optional)</label><div className="relative"><LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} /><input id="portfolio" type="url" placeholder="https://yourportfolio.com" value={portfolio} onChange={(e) => setPortfolio(e.target.value)} className="w-full pl-10 p-3 text-gray-900 rounded-lg bg-gray-100 border border-transparent focus:bg-white focus:border-pink-500" /></div></div>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="font-medium text-gray-700">Profile Picture (Max 5MB)</label>
                    <div className="flex items-center gap-4">
                        <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden"><img src={imagePreview || 'https://placehold.co/96x96/e2e8f0/4a5568?text=Photo'} alt="Preview" className="w-full h-full object-cover" /></div>
                        <label htmlFor="file-upload" className="cursor-pointer bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-50 transition"><UploadCloud className="inline mr-2" size={18} /><span>Upload</span></label>
                        <input id="file-upload" name="mainImage" type="file" className="sr-only" accept="image/*" onChange={handleImageChange} required />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="font-medium text-gray-700">Sample Video (Optional, Max 50MB)</label>
                    {videoPreview ? (
                        <div className="w-full p-2 border rounded-lg"><video src={videoPreview} controls className="w-full rounded-md max-h-24"></video><button type="button" onClick={() => {setVideoFile(null); setVideoPreview('');}} className="text-xs text-red-500 hover:underline mt-1">Remove</button></div>
                    ) : (
                        <label htmlFor="video-upload" className="flex flex-col items-center justify-center w-full h-28 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"><div className="flex flex-col items-center justify-center"><Video className="w-8 h-8 mb-2 text-gray-400" /><p className="text-xs text-gray-500">Click to upload</p></div><input id="video-upload" type="file" className="sr-only" accept="video/*" onChange={handleVideoChange} /></label>
                    )}
                </div>
            </div>
            <button type="submit" className="w-full flex justify-center items-center bg-pink-500 hover:bg-pink-600 text-white p-4 rounded-lg font-bold text-lg transition disabled:bg-pink-300" disabled={isLoading}>{isLoading ? <><Loader className="animate-spin mr-2" /><span>Creating Profile...</span></> : 'Submit Profile'}</button>
          </form>
        </motion.div>
      </div>
    </>
  );
};

export default PhotographerUpload;
