import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../Context/AuthContext'; // Make sure this path is correct for your project
import { UploadCloud, User, Link as LinkIcon, CheckCircle, AlertTriangle, Loader, Camera, Video, Image as ImageIcon, X } from 'lucide-react';

// A hook for showing temporary notifications
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
  const [imagePreview, setImagePreview] = useState('');
  
  // State for the new gallery upload
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [galleryPreviews, setGalleryPreviews] = useState([]);

  const [isLoading, setIsLoading] = useState(false);
  const { notification, showNotification } = useNotification();
  const { token, user } = useAuth();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB
        showNotification('Image file is too large (Max 5MB).', 'error');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };
  
  // Handler for the new multi-image gallery input
  const handleGalleryChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Combine new files with existing ones, but don't exceed the limit (e.g., 8)
    const totalFiles = [...galleryFiles, ...files].slice(0, 8);
    
    // Validate new files
    for (const file of files) {
        if (file.size > 5 * 1024 * 1024) { // 5MB
            showNotification(`File ${file.name} is too large (Max 5MB).`, 'error');
            return; // Stop the process if one file is invalid
        }
    }

    setGalleryFiles(totalFiles);
    
    const newPreviews = totalFiles.map(file => ({
        url: URL.createObjectURL(file),
        name: file.name
    }));
    setGalleryPreviews(newPreviews);
  };

  const removeGalleryImage = (indexToRemove) => {
    setGalleryFiles(prev => prev.filter((_, index) => index !== indexToRemove));
    setGalleryPreviews(prev => prev.filter((_, index) => index !== indexToRemove));
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageFile) {
      showNotification('A main profile picture is required.', 'error');
      return;
    }
    // Add validation for the gallery images
    if (galleryFiles.length < 4) {
        showNotification('A minimum of 4 gallery images are required.', 'error');
        return;
    }

    setIsLoading(true);

    const formData = new FormData();
    formData.append('name', name);
    formData.append('gender', gender);
    formData.append('bio', bio);
    formData.append('portfolio', portfolio);
    formData.append('mainImage', imageFile);
    
    // Append all gallery files
    galleryFiles.forEach(file => {
        formData.append('galleryImages', file);
    });

    formData.append('role', user.role);

    try {
      const res = await fetch('https://modelconnect-api.onrender.com/api/models', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'An unknown error occurred.');
      
      showNotification('Profile created successfully!', 'success');
      // Reset form state
      setName(''); setGender(''); setBio(''); setPortfolio('');
      setImageFile(null); setImagePreview('');
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
                initial={{ opacity: 0, y: -50 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: 50 }} 
                className={`fixed top-24 right-5 z-50 flex items-center p-4 rounded-lg shadow-lg text-white ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}
            >
                {notification.type === 'success' ? <CheckCircle className="mr-3" /> : <AlertTriangle className="mr-3" />}
                {notification.message}
            </motion.div>
        )}
      </AnimatePresence>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-xl space-y-8">
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

            {/* Main Profile Picture Upload */}
            <div className="space-y-2">
                <label className="font-medium text-gray-700">Profile Picture (Required, Max 5MB)</label>
                <div className="flex items-center gap-4">
                    <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-gray-200">
                        <img src={imagePreview || 'https://placehold.co/96x96/e2e8f0/4a5568?text=Photo'} alt="Profile Preview" className="w-full h-full object-cover" />
                    </div>
                    <label htmlFor="file-upload" className="cursor-pointer bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-50 transition"><UploadCloud className="inline mr-2" size={18} /><span>Upload</span></label>
                    <input id="file-upload" name="mainImage" type="file" className="sr-only" accept="image/*" onChange={handleImageChange} />
                </div>
            </div>

            {/* Gallery Images Upload Section */}
            <div className="space-y-2">
                <label className="font-medium text-gray-700">Gallery Images (Min 4, Max 8)</label>
                <label htmlFor="gallery-upload" className="flex flex-col items-center justify-center w-full p-6 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                    <div className="flex flex-col items-center justify-center">
                        <ImageIcon className="w-10 h-10 mb-2 text-gray-400" />
                        <p className="font-semibold text-pink-500">Click to upload your gallery</p>
                        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB each</p>
                    </div>
                    <input id="gallery-upload" type="file" className="sr-only" accept="image/*" onChange={handleGalleryChange} multiple />
                </label>
                {galleryPreviews.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4 mt-4">
                        {galleryPreviews.map((preview, index) => (
                            <div key={index} className="relative group">
                                <img src={preview.url} alt={preview.name} className="w-full h-24 object-cover rounded-md border" />
                                <button type="button" onClick={() => removeGalleryImage(index)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <button type="submit" className="w-full flex justify-center items-center bg-pink-500 hover:bg-pink-600 text-white p-4 rounded-lg font-bold text-lg transition disabled:bg-pink-300" disabled={isLoading}>
                {isLoading ? <><Loader className="animate-spin mr-2" /><span>Creating Profile...</span></> : 'Submit Profile'}
            </button>
          </form>
        </motion.div>
      </div>
    </>
  );
};

export default PhotographerUpload;
