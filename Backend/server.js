const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 5000;
const JWT_SECRET = 'your_super_strong_jwt_secret_key'; // IMPORTANT: Change this!

// ===== Middleware =====
app.use(cors({
  origin: "https://your-frontend-url.com" // Replace with your actual frontend URL later
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// ===== MySQL Connection Pool =====
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  ssl: { "rejectUnauthorized": true } // Often required by cloud databases
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

// ===== Multer for file uploads =====
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`)
});

// Generic uploader for mixed file types
const fileUploader = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // Use larger limit
});

// Video-only uploader
const videoUpload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('video/')) cb(null, true);
        else cb(new Error('Only video files are allowed!'), false);
    }
});

// Image-only uploader
const imageUpload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Only image files are allowed!'), false);
    }
});


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
app.get('/', (req, res) => res.send('✅ API is running'));

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

// CORRECTED: Create initial model/photographer profile
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

        const mainImage = mainImageFile.filename;
        const sampleVideo = sampleVideoFile ? sampleVideoFile.filename : null;
        
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            const [result] = await connection.query(
                'INSERT INTO models (name, gender, bio, portfolio, instagram_id, image, sample_video_url, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [name, gender, bio, portfolio, instagram_id, mainImage, sampleVideo, user_id]
            );
            const modelId = result.insertId;

            // Add all uploaded images to the gallery. The frontend sends the main image as the first image in the gallery array.
            const galleryValues = galleryImageFiles.map(file => [modelId, file.filename]);
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
        const galleryValues = req.files.map(file => [modelId, file.filename]);
        await connection.query('INSERT INTO model_images (model_id, image_url) VALUES ?', [galleryValues]);
        await connection.commit();
        res.status(201).json({ message: `${req.files.length} images uploaded successfully.` });
    } catch (error) {
        await connection.rollback();
        req.files.forEach(file => {
            if (fs.existsSync(path.join(uploadDir, file.filename))) {
                fs.unlinkSync(path.join(uploadDir, file.filename));
            }
        });
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
        const imagePath = path.join(uploadDir, imageUrlToDelete);
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
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
            if (videoFile) fs.unlinkSync(path.join(uploadDir, videoFile.filename));
            return res.status(400).json({ message: 'Video file, title, and description are required.' });
        }
        await db.query('INSERT INTO editor_uploads (user_id, title, description, video_url) VALUES (?, ?, ?, ?)', [userId, title, description, videoFile.filename]);
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
        const videoPath = path.join(uploadDir, videos[0].video_url);
        if (fs.existsSync(videoPath)) {
            fs.unlinkSync(videoPath);
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
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
