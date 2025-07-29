const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const multer = require('multer');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || '113fad8deec90d2767ae4fc4ddbc490e';

// ===== Cloudinary Configuration =====
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// ===== Middleware =====
app.use(cors({
  origin: process.env.FRONTEND_URL || "https://modelling-site.vercel.app"
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ===== MySQL Connection Pool (Google Cloud SQL) =====
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {
    rejectUnauthorized: false
  }
});

// Test DB connection
db.getConnection()
    .then(conn => {
        console.log('✅ Connected to MySQL Database');
        conn.release();
    })
    .catch(err => {
        console.error('❌ MySQL connection error:', err);
    });

// ===== Cloudinary Storage Configuration =====
const imageStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'modelconnect/images',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto' }]
    }
});

const videoStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'modelconnect/videos',
        resource_type: 'video',
        allowed_formats: ['mp4', 'mov', 'avi', 'mkv', 'webm'],
        transformation: [{ width: 1280, height: 720, crop: 'limit', quality: 'auto' }]
    }
});

// ===== Multer Configuration =====
// Generic uploader for mixed file types
const fileUploader = multer({
    storage: imageStorage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image and video files are allowed!'), false);
        }
    }
});

// Video-only uploader
const videoUpload = multer({
    storage: videoStorage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB for videos
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('video/')) cb(null, true);
        else cb(new Error('Only video files are allowed!'), false);
    }
});

// Image-only uploader
const imageUpload = multer({ 
    storage: imageStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB for images
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Only image files are allowed!'), false);
    }
});

// ===== Helper Functions =====
const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
    try {
        const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
        console.log('Deleted from Cloudinary:', result);
        return result;
    } catch (error) {
        console.error('Error deleting from Cloudinary:', error);
        throw error;
    }
};

const extractPublicId = (cloudinaryUrl) => {
    try {
        // Extract public_id from Cloudinary URL
        // Example: https://res.cloudinary.com/demo/image/upload/v1234567890/modelconnect/images/sample.jpg
        const urlParts = cloudinaryUrl.split('/');
        const uploadIndex = urlParts.findIndex(part => part === 'upload');
        if (uploadIndex !== -1 && uploadIndex + 2 < urlParts.length) {
            // Get everything after version number
            const pathAfterVersion = urlParts.slice(uploadIndex + 2).join('/');
            // Remove file extension
            return pathAfterVersion.replace(/\.[^/.]+$/, '');
        }
        return null;
    } catch (error) {
        console.error('Error extracting public ID:', error);
        return null;
    }
};

// ===== Auth Middleware (JWT & Role Restriction) =====
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ message: 'Access denied. No token provided.' });
  const token = authHeader.split(' ')[1];
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: 'Invalid token.' });
    req.user = decoded;
    next();
  });
};

const restrictTo = (...roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) return res.status(403).json({ message: 'You do not have permission to perform this action.' });
    next();
};

// ===== API Routes =====

// Test Route
app.get('/', (req, res) => res.send('✅ API is running with Cloudinary'));

// ===== AUTH ROUTES =====
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const validRoles = ['model', 'photographer', 'editor', 'recruiter'];
    if (!name || !email || !password || !role || !validRoles.includes(role)) {
      return res.status(400).json({ message: 'All fields are required and role must be valid.' });
    }
    const [existingUsers] = await db.query('SELECT email FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
        return res.status(409).json({ message: 'User with this email already exists.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', [name, email, hashedPassword, role]);
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during registration.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }
        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }
        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '2h' });
        res.json({ 
            message: 'Login successful', 
            token, 
            user: { id: user.id, name: user.name, email: user.email, role: user.role } 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during login.' });
    }
});

// ===== USER ROUTES (for Admins) =====
app.get('/api/users', verifyToken, restrictTo('admin'), async (req, res) => {
    try {
        const [users] = await db.query('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC');
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch users.' });
    }
});

// ===== CATALOGUE ROUTES =====
app.get('/api/models', verifyToken, restrictTo('recruiter', 'admin'), async (req, res) => {
  try {
    const query = `SELECT m.*, u.role FROM models m JOIN users u ON m.user_id = u.id ORDER BY m.created_at DESC`;
    const [results] = await db.query(query);
    res.json(results);
  } catch (error) {
    console.error('Error fetching models:', error);
    res.status(500).json({ message: 'Failed to fetch models.' });
  }
});

app.get('/api/editors/videos', verifyToken, restrictTo('recruiter', 'admin'), async (req, res) => {
    try {
        const query = `SELECT e.id, e.title, e.description, e.video_url, e.created_at, u.name as editor_name, u.id as user_id FROM editor_uploads e JOIN users u ON e.user_id = u.id ORDER BY e.created_at DESC`;
        const [videos] = await db.query(query);
        res.json(videos);
    } catch (error) {
        console.error('Error fetching editor videos:', error);
        res.status(500).json({ message: 'Failed to fetch editor videos.' });
    }
});

// ===== PROFILE ROUTES =====

// Create initial model/photographer profile
app.post(
    '/api/models', 
    verifyToken, 
    fileUploader.fields([
        { name: 'mainImage', maxCount: 1 },
        { name: 'galleryImages', maxCount: 8 },
        { name: 'sampleVideo', maxCount: 1 }
    ]), 
    async (req, res) => {
        const { name, gender, bio, portfolio, instagram_id, role } = req.body;
        const user_id = req.user.id;

        const mainImageFile = req.files.mainImage ? req.files.mainImage[0] : null;
        const sampleVideoFile = req.files.sampleVideo ? req.files.sampleVideo[0] : null;
        const galleryImageFiles = req.files.galleryImages || [];

        // Validation
        if (!mainImageFile || !mainImageFile.mimetype.startsWith('image/')) {
            return res.status(400).json({ message: 'A valid main profile image is required.' });
        }
        if (sampleVideoFile && !sampleVideoFile.mimetype.startsWith('video/')) {
            return res.status(400).json({ message: 'The sample work must be a valid video file.' });
        }
        if (['model', 'photographer'].includes(role) && galleryImageFiles.length < 4) {
            return res.status(400).json({ message: 'A minimum of 4 gallery images are required at signup.' });
        }
        if (!name || !gender || !bio) {
            return res.status(400).json({ message: 'Name, gender, and bio are required.' });
        }

        // Store Cloudinary URLs instead of filenames
        const mainImage = mainImageFile.path; // Cloudinary URL
        const sampleVideo = sampleVideoFile ? sampleVideoFile.path : null; // Cloudinary URL
        
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            const [result] = await connection.query(
                'INSERT INTO models (name, gender, bio, portfolio, instagram_id, image, sample_video_url, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [name, gender, bio, portfolio, instagram_id, mainImage, sampleVideo, user_id]
            );
            const modelId = result.insertId;

            // Add all uploaded images to the gallery using Cloudinary URLs
            const galleryValues = galleryImageFiles.map(file => [modelId, file.path]);
            if (galleryValues.length > 0) {
                 await connection.query('INSERT INTO model_images (model_id, image_url) VALUES ?', [galleryValues]);
            }
            
            await connection.commit();
            res.status(201).json({ message: 'Profile created successfully!' });
        } catch (error) {
            await connection.rollback();
            console.error(error);
            res.status(500).json({ message: 'Failed to create profile.' });
        } finally {
            connection.release();
        }
    }
);

// Fetch the logged-in user's own profile
app.get('/api/models/my-profile', verifyToken, async (req, res) => {
    try {
        const [profileRows] = await db.query('SELECT * FROM models WHERE user_id = ?', [req.user.id]);
        if (profileRows.length === 0) return res.status(404).json({ message: 'Profile not found.' });
        const profile = profileRows[0];
        const [galleryRows] = await db.query('SELECT id, image_url FROM model_images WHERE model_id = ?', [profile.id]);
        profile.gallery = galleryRows;
        res.json(profile);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching profile.' });
    }
});

// Update profile TEXT details
app.put('/api/models/my-profile', verifyToken, async (req, res) => {
    try {
        const { name, gender, bio, portfolio, instagram_id } = req.body;
        await db.query('UPDATE models SET name = ?, gender = ?, bio = ?, portfolio = ?, instagram_id = ? WHERE user_id = ?', [name, gender, bio, portfolio, instagram_id, req.user.id]);
        res.json({ message: 'Profile details updated successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to update profile details.' });
    }
});

// Upload NEW gallery images
app.post('/api/models/my-profile/gallery', verifyToken, imageUpload.array('galleryImages', 8), async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const [modelRows] = await connection.query('SELECT id FROM models WHERE user_id = ?', [req.user.id]);
        if (modelRows.length === 0) throw new Error('Profile not found.');
        const modelId = modelRows[0].id;
        const [existingImages] = await connection.query('SELECT COUNT(*) as count FROM model_images WHERE model_id = ?', [modelId]);
        const existingCount = existingImages[0].count;
        if (existingCount + req.files.length > 8) {
            throw new Error(`You can only upload ${8 - existingCount} more images. Limit is 8.`);
        }
        if (req.files.length === 0) return res.status(400).json({ message: 'No images were uploaded.' });
        
        // Store Cloudinary URLs instead of filenames
        const galleryValues = req.files.map(file => [modelId, file.path]);
        await connection.query('INSERT INTO model_images (model_id, image_url) VALUES ?', [galleryValues]);
        await connection.commit();
        res.status(201).json({ message: `${req.files.length} images uploaded successfully.` });
    } catch (error) {
        await connection.rollback();
        // Clean up uploaded files from Cloudinary on error
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                try {
                    const publicId = extractPublicId(file.path);
                    if (publicId) {
                        await deleteFromCloudinary(publicId);
                    }
                } catch (cleanupError) {
                    console.error('Error cleaning up Cloudinary file:', cleanupError);
                }
            }
        }
        console.error(error);
        res.status(500).json({ message: error.message || 'Failed to upload images.' });
    } finally {
        connection.release();
    }
});

// Set an existing gallery image as the main profile image
app.put('/api/models/my-profile/main-image', verifyToken, async (req, res) => {
    try {
        const { imageUrl } = req.body;
        if (!imageUrl) return res.status(400).json({ message: 'Image URL is required.' });
        const [modelRows] = await db.query('SELECT id FROM models WHERE user_id = ?', [req.user.id]);
        if (modelRows.length === 0) return res.status(404).json({ message: 'Profile not found.' });
        const modelId = modelRows[0].id;
        const [imageRows] = await db.query('SELECT id FROM model_images WHERE model_id = ? AND image_url = ?', [modelId, imageUrl]);
        if (imageRows.length === 0) return res.status(403).json({ message: 'This image does not belong to your profile.' });
        await db.query('UPDATE models SET image = ? WHERE id = ?', [imageUrl, modelId]);
        res.json({ message: 'Main profile image updated successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to set main image.' });
    }
});

// Delete an image from the gallery
app.delete('/api/models/my-profile/gallery/:imageId', verifyToken, async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const { imageId } = req.params;
        const [modelRows] = await connection.query('SELECT id, image FROM models WHERE user_id = ?', [req.user.id]);
        if (modelRows.length === 0) throw new Error('Profile not found.');
        const { id: modelId, image: mainImage } = modelRows[0];
        const [imageRows] = await connection.query('SELECT image_url FROM model_images WHERE id = ? AND model_id = ?', [imageId, modelId]);
        if (imageRows.length === 0) throw new Error('Image not found or you do not have permission to delete it.');
        const imageUrlToDelete = imageRows[0].image_url;
        if (mainImage === imageUrlToDelete) {
            throw new Error('Cannot delete the main profile image. Please set a different one first.');
        }
        
        await connection.query('DELETE FROM model_images WHERE id = ?', [imageId]);
        
        // Delete from Cloudinary
        try {
            const publicId = extractPublicId(imageUrlToDelete);
            if (publicId) {
                await deleteFromCloudinary(publicId);
            }
        } catch (cloudinaryError) {
            console.error('Error deleting from Cloudinary:', cloudinaryError);
            // Continue anyway since DB deletion was successful
        }
        
        await connection.commit();
        res.json({ message: 'Image deleted successfully.' });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(400).json({ message: error.message || 'Failed to delete image.' });
    } finally {
        connection.release();
    }
});

// Fetch a specific public profile by user_id
app.get('/api/profile/:userId', verifyToken, async (req, res) => {
    try {
        const { userId } = req.params;
        const query = `
            SELECT m.*, u.role 
            FROM models m 
            JOIN users u ON m.user_id = u.id 
            WHERE m.user_id = ?
        `;
        const [profileRows] = await db.query(query, [userId]);

        if (profileRows.length === 0) {
            return res.status(404).json({ message: 'Profile not found.' });
        }
        const profile = profileRows[0];

        const [galleryRows] = await db.query('SELECT id, image_url FROM model_images WHERE model_id = ?', [profile.id]);
        profile.gallery = galleryRows;

        res.json(profile);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching profile.' });
    }
});

// ===== EDITOR ROUTES =====
app.post('/api/editor/upload', verifyToken, restrictTo('editor'), videoUpload.single('video'), async (req, res) => {
    try {
        const { title, description } = req.body;
        const videoFile = req.file;
        const userId = req.user.id;
        if (!title || !description || !videoFile) {
            return res.status(400).json({ message: 'Video file, title, and description are required.' });
        }
        
        // Store Cloudinary URL instead of filename
        await db.query('INSERT INTO editor_uploads (user_id, title, description, video_url) VALUES (?, ?, ?, ?)', [userId, title, description, videoFile.path]);
        res.status(201).json({ message: 'Video uploaded successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during video upload.' });
    }
});

app.get('/api/editor/my-videos', verifyToken, restrictTo('editor'), async (req, res) => {
    try {
        const [videos] = await db.query('SELECT * FROM editor_uploads WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
        res.json(videos);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch your videos.' });
    }
});

app.delete('/api/editor/videos/:videoId', verifyToken, restrictTo('editor'), async (req, res) => {
    try {
        const { videoId } = req.params;
        const userId = req.user.id;
        const [videos] = await db.query('SELECT video_url FROM editor_uploads WHERE id = ? AND user_id = ?', [videoId, userId]);
        if (videos.length === 0) {
            return res.status(404).json({ message: 'Video not found or you do not have permission to delete it.' });
        }
        
        await db.query('DELETE FROM editor_uploads WHERE id = ?', [videoId]);
        
        // Delete from Cloudinary
        try {
            const publicId = extractPublicId(videos[0].video_url);
            if (publicId) {
                await deleteFromCloudinary(publicId, 'video');
            }
        } catch (cloudinaryError) {
            console.error('Error deleting video from Cloudinary:', cloudinaryError);
        }
        
        res.json({ message: 'Video deleted successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to delete video.' });
    }
});

// ===== Global Error Handler =====
app.use((err, req, res, next) => {
    console.error(err.stack);
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: err.message });
 }
    res.status(500).send('Something broke!');
});

// ===== Start Server =====
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT} with Cloudinary integration`));