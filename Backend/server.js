const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const multer = require('multer');
// 'path' and 'fs' are no longer needed as we are not using the local filesystem
// const path = require('path');
// const fs = require('fs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// ===== NEW: Environment Variable Check =====
// Ensure critical environment variables are set before starting the server.
// This is a security best practice to prevent running with insecure defaults.
const requiredEnvVars = [
    'DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_DATABASE', 'JWT_SECRET',
    'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'
];
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        console.error(`❌ FATAL ERROR: Environment variable ${envVar} is not set.`);
        process.exit(1); // Exit the process with an error code
    }
}

const app = express();
const PORT = process.env.PORT || 5000;
// REMOVED: Insecure fallback for JWT_SECRET is gone due to the check above.
const JWT_SECRET = process.env.JWT_SECRET;

// ===== Middleware =====
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000"
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== Cloudinary Configuration =====
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// ===== MySQL Connection Pool =====
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: {
        // WARNING: rejectUnauthorized: false is insecure for production.
        // It's better to provide the CA certificate from your DB provider.
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

// ===== Multer for file uploads using Cloudinary =====
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'modelconnect',
        resource_type: 'auto',
        allowed_formats: ['jpeg', 'png', 'jpg', 'mp4', 'mov', 'avi']
    },
});

const fileUploader = multer({ storage: storage });

// ===== NEW: Cloudinary Deletion Helper =====
// This helper extracts the public_id from a full Cloudinary URL.
// The public_id is required to delete the asset from Cloudinary.
const getPublicIdFromUrl = (url) => {
    // Example URL: http://res.cloudinary.com/cloud_name/image/upload/v12345/modelconnect/ab1cde2fgh.jpg
    // The public_id we need is "modelconnect/ab1cde2fgh"
    const regex = /\/modelconnect\/([^.]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
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
app.get('/', (req, res) => res.send('✅ API is running'));

// ===== AUTH ROUTES =====
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        const validRoles = ['model', 'photographer', 'editor', 'recruiter', 'admin'];
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
            user: { id: user.id, name: user.name, email: user.email, role: user.role, hasProfile: !!user.has_profile } // NEW: Pass profile status
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
        const query = `SELECT m.*, u.role, u.email FROM models m JOIN users u ON m.user_id = u.id ORDER BY m.created_at DESC`;
        const [results] = await db.query(query);
        res.json(results);
    } catch (error) {
        console.error('Error fetching models:', error);
        res.status(500).json({ message: 'Failed to fetch models.' });
    }
});

app.get('/api/editors/videos', verifyToken, restrictTo('recruiter', 'admin'), async (req, res) => {
    try {
        const query = `SELECT e.id, e.title, e.description, e.video_url, e.created_at, u.name as editor_name, u.id as user_id, u.email FROM editor_uploads e JOIN users u ON e.user_id = u.id ORDER BY e.created_at DESC`;
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
    // CHANGED: Added role restriction. Only models and photographers can create these profiles.
    restrictTo('model', 'photographer'),
    fileUploader.fields([
        { name: 'mainImage', maxCount: 1 },
        { name: 'galleryImages', maxCount: 8 },
        { name: 'sampleVideo', maxCount: 1 }
    ]),
    async (req, res) => {
        // CHANGED: Removed `role` from body. It should come from the user's token, not client input.
        const { name, gender, bio, portfolio, instagram_id } = req.body;
        const user_id = req.user.id;

        const mainImage = req.files.mainImage ? req.files.mainImage[0].path : null;
        const sampleVideo = req.files.sampleVideo ? req.files.sampleVideo[0].path : null;
        const galleryImageFiles = req.files.galleryImages || [];

        // Validation
        if (!mainImage) {
            return res.status(400).json({ message: 'A valid main profile image is required.' });
        }
        // CHANGED: Use role from authenticated user
        if (['model', 'photographer'].includes(req.user.role) && galleryImageFiles.length < 4) {
            return res.status(400).json({ message: 'A minimum of 4 gallery images are required at signup.' });
        }
        if (!name || !gender || !bio) {
            return res.status(400).json({ message: 'Name, gender, and bio are required.' });
        }
        
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            const [result] = await connection.query(
                'INSERT INTO models (name, gender, bio, portfolio, instagram_id, image, sample_video_url, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [name, gender, bio, portfolio, instagram_id, mainImage, sampleVideo, user_id]
            );
            const modelId = result.insertId;

            const galleryValues = galleryImageFiles.map(file => [modelId, file.path]);
            if (galleryValues.length > 0) {
                 await connection.query('INSERT INTO model_images (model_id, image_url) VALUES ?', [galleryValues]);
            }
            
            // NEW: Mark that the user has created a profile.
            await connection.query('UPDATE users SET has_profile = true WHERE id = ?', [user_id]);

            await connection.commit();
            res.status(201).json({ message: 'Profile created successfully!' });
        } catch (error) {
            await connection.rollback();
            console.error(error);
            // NEW: If files were uploaded but transaction failed, delete them from Cloudinary.
            if (mainImage) await cloudinary.uploader.destroy(getPublicIdFromUrl(mainImage));
            if (sampleVideo) await cloudinary.uploader.destroy(getPublicIdFromUrl(sampleVideo), { resource_type: 'video' });
            for (const file of galleryImageFiles) {
                await cloudinary.uploader.destroy(getPublicIdFromUrl(file.path));
            }
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
app.post('/api/models/my-profile/gallery', verifyToken, fileUploader.array('galleryImages', 8), async (req, res) => {
    if (req.files.length === 0) {
        return res.status(400).json({ message: 'No images were uploaded.' });
    }
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const [modelRows] = await connection.query('SELECT id FROM models WHERE user_id = ?', [req.user.id]);
        if (modelRows.length === 0) throw new Error('Profile not found.');
        const modelId = modelRows[0].id;
        const [existingImages] = await connection.query('SELECT COUNT(*) as count FROM model_images WHERE model_id = ?', [modelId]);
        const existingCount = existingImages[0].count;
        if (existingCount + req.files.length > 8) {
            // NEW: Clean up the just-uploaded files from Cloudinary if validation fails.
            for (const file of req.files) {
                await cloudinary.uploader.destroy(getPublicIdFromUrl(file.path));
            }
            throw new Error(`You can only upload ${8 - existingCount} more images. Limit is 8.`);
        }
        
        const galleryValues = req.files.map(file => [modelId, file.path]);
        await connection.query('INSERT INTO model_images (model_id, image_url) VALUES ?', [galleryValues]);
        await connection.commit();
        res.status(201).json({ message: `${req.files.length} images uploaded successfully.` });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ message: error.message || 'Failed to upload images.' });
    } finally {
        connection.release();
    }
});

// Delete an image from the gallery
// CHANGED: This route now also deletes the file from Cloudinary.
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

        // NEW: Delete from Cloudinary first
        const publicId = getPublicIdFromUrl(imageUrlToDelete);
        if (publicId) {
            await cloudinary.uploader.destroy(publicId);
        }

        // Then delete from the database
        await connection.query('DELETE FROM model_images WHERE id = ?', [imageId]);
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


// Set an existing gallery image as the main profile image
app.put('/api/models/my-profile/main-image', verifyToken, async (req, res) => {
    try {
        const { imageUrl } = req.body;
        if (!imageUrl) return res.status(400).json({ message: 'Image URL is required.' });
        const [modelRows] = await db.query('SELECT id FROM models WHERE user_id = ?', [req.user.id]);
        if (modelRows.length === 0) return res.status(404).json({ message: 'Profile not found.' });
        const modelId = modelRows[0].id;

        // Verify the image belongs to the user's gallery
        const [imageRows] = await db.query('SELECT id FROM model_images WHERE model_id = ? AND image_url = ?', [modelId, imageUrl]);
        if (imageRows.length === 0) return res.status(403).json({ message: 'This image does not belong to your profile.' });

        await db.query('UPDATE models SET image = ? WHERE id = ?', [imageUrl, modelId]);
        res.json({ message: 'Main profile image updated successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to set main image.' });
    }
});

// Fetch a specific public profile by user_id
app.get('/api/profile/:userId', verifyToken, async (req, res) => {
    try {
        const { userId } = req.params;
        const query = `
            SELECT m.*, u.role, u.email 
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
app.post('/api/editor/upload', verifyToken, restrictTo('editor'), fileUploader.single('video'), async (req, res) => {
    try {
        const { title, description } = req.body;
        const videoFile = req.file;
        const userId = req.user.id;
        if (!title || !description || !videoFile) {
            // NEW: If validation fails after upload, delete the orphaned file from Cloudinary.
            if(videoFile) await cloudinary.uploader.destroy(getPublicIdFromUrl(videoFile.path), { resource_type: 'video' });
            return res.status(400).json({ message: 'Video file, title, and description are required.' });
        }
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

// Delete an editor's video
// CHANGED: This now also deletes the file from Cloudinary.
app.delete('/api/editor/videos/:videoId', verifyToken, restrictTo('editor'), async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const { videoId } = req.params;
        const userId = req.user.id;

        const [videos] = await connection.query('SELECT video_url FROM editor_uploads WHERE id = ? AND user_id = ?', [videoId, userId]);
        if (videos.length === 0) {
            return res.status(404).json({ message: 'Video not found or you do not have permission to delete it.' });
        }

        // NEW: Delete from Cloudinary
        const videoUrlToDelete = videos[0].video_url;
        const publicId = getPublicIdFromUrl(videoUrlToDelete);
        if (publicId) {
            await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
        }
        
        // Delete from DB
        await connection.query('DELETE FROM editor_uploads WHERE id = ?', [videoId]);
        await connection.commit();

        res.json({ message: 'Video deleted successfully.' });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ message: 'Failed to delete video.' });
    } finally {
        connection.release();
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