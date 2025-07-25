import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../Context/AuthContext';
import { Film, Type, FileText, UploadCloud, CheckCircle, AlertTriangle, Loader } from 'lucide-react';

// Custom hook for handling notifications
const useNotification = () => {
  const [notification, setNotification] = useState(null);
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };
  return { notification, showNotification };
};

const EditorUpload = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { notification, showNotification } = useNotification();
  const { token } = useAuth();

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) { // 50MB
        showNotification('File is too large. Max size is 50MB.', 'error');
        return;
      }
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!videoFile) {
      showNotification('Please select a video file to upload.', 'error');
      return;
    }
    setIsLoading(true);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('video', videoFile);

    try {
      const res = await fetch('https://modelconnect-api.onrender.com/api/editor/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Upload failed.');
      
      showNotification('Video uploaded successfully!', 'success');
      setTitle('');
      setDescription('');
      setVideoFile(null);
      setVideoPreview('');
      e.target.reset(); // Reset file input
    } catch (error) {
      showNotification(error.message, 'error');
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

      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl mx-auto"
        >
          <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-xl space-y-6">
            <div className="text-center">
              <Film className="mx-auto text-pink-500 mb-4" size={48} />
              <h2 className="text-4xl font-bold text-gray-800">Upload Your Work</h2>
              <p className="text-gray-500 mt-2">Showcase your best video edits to recruiters.</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="title" className="font-medium text-gray-700">Video Title</label>
              <div className="relative">
                <Type className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input id="title" type="text" placeholder="e.g., Summer Fashion Reel" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full pl-10 p-3 text-gray-900 rounded-lg bg-gray-100 border border-transparent focus:bg-white focus:border-pink-500" required />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="font-medium text-gray-700">Description</label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 text-gray-400" size={20} />
                <textarea id="description" placeholder="Describe the project, your role, software used, etc." value={description} onChange={(e) => setDescription(e.target.value)} className="w-full pl-10 p-3 text-gray-900 rounded-lg bg-gray-100 border border-transparent focus:bg-white focus:border-pink-500 min-h-[120px]" required />
              </div>
            </div>

            <div className="space-y-2">
              <label className="font-medium text-gray-700">Video File (Max 50MB)</label>
              {videoPreview ? (
                <div className="w-full p-4 border rounded-lg">
                    <video src={videoPreview} controls className="w-full rounded-md max-h-64"></video>
                    <button type="button" onClick={() => {setVideoFile(null); setVideoPreview('');}} className="text-sm text-red-500 hover:underline mt-2">Remove video</button>
                </div>
              ) : (
                <label htmlFor="video-upload" className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <UploadCloud className="w-10 h-10 mb-3 text-gray-400" />
                    <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                    <p className="text-xs text-gray-500">MP4, MOV, AVI, etc. (MAX. 50MB)</p>
                  </div>
                  <input id="video-upload" type="file" className="sr-only" accept="video/*" onChange={handleVideoChange} />
                </label>
              )}
            </div>

            <button type="submit" className="w-full flex justify-center items-center bg-pink-500 hover:bg-pink-600 text-white p-4 rounded-lg font-bold text-lg transition disabled:bg-pink-300" disabled={isLoading}>
              {isLoading ? <><Loader className="animate-spin mr-2" /><span>Uploading...</span></> : 'Submit Video'}
            </button>
          </form>
        </motion.div>
      </div>
    </>
  );
};

export default EditorUpload;
