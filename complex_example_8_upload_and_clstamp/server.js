const express = require('express');
const multer = require('multer');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Configure multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Serve the HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Handle file upload and stamping
app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        // Check if environment variables are set
        if (!process.env.API_BASE_URL || !process.env.API_KEY || !process.env.API_SECRET) {
            return res.status(500).json({
                success: false,
                message: 'API credentials not configured. Please set API_BASE_URL, API_KEY, and API_SECRET in .env file.'
            });
        }

        // Create FormData for the external API
        const formData = new FormData();
        formData.append('file', req.file.buffer, {
            filename: req.file.originalname,
            contentType: req.file.mimetype || 'application/octet-stream'
        });

        // Get parameters from request
        const groupId = req.body.groupId || 'Uploads';
        const network = req.body.network || 'public';
        const stampImmediately = req.body['stamp-immediately'] || 'true';

        // Upload to external API
        const response = await fetch(`${process.env.API_BASE_URL}/webhook/${process.env.API_KEY}`, {
            method: 'POST',
            headers: {
                'secret-key': process.env.API_SECRET,
                'group-id': groupId,
                'network': network,
                'stamp-immediately': stampImmediately,
                ...formData.getHeaders()
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        console.log(`✅ Uploaded ${req.file.originalname} (${data.hash})`);
        if (data.message) console.log(` ${data.message}`);
        if (data.files_stamped) console.log(`✅ Stamped ${data.files_stamped} files`);

        res.json(data);

    } catch (error) {
        console.error('❌ Upload error:', error.message);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Health check endpoint
app.get('/api/healthcheck', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'upload-and-clstamp-server',
        version: '1.0.0'
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} to use the application`);

    if (process.env.API_KEY && process.env.API_SECRET) {
        console.log('✅ API credentials configured');
    } else {
        console.log('⚠️  API credentials not configured. Please set API_KEY and API_SECRET in .env file');
    }
}); 