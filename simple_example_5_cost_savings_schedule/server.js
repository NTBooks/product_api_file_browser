const express = require('express');
const fileUpload = require('express-fileupload');
const path = require('path');
const fs = require('fs').promises;
const cron = require('node-cron');
const axios = require('axios');
const FormData = require('form-data');

// Load environment variables from root directory
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.EX5_PORT || 3045;
const API_BASE_URL = process.env.API_BASE_URL;
const API_KEY = process.env.API_KEY;
const API_SECRET = process.env.API_SECRET;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload({
    createParentPath: true,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
}));

// Serve static files
app.use(express.static('public'));

// .dirty flag file path
const dirtyFile = path.join(__dirname, '.dirty');

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Upload files directly to API
app.post('/upload', async (req, res) => {
    try {
        if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).json({
                status: 'error',
                message: 'No files were uploaded.'
            });
        }
        const groupId = 'ScheduledUploads';
        const files = Array.isArray(req.files.files) ? req.files.files : [req.files.files];
        const uploadedFiles = [];
        for (const file of files) {
            const formData = new FormData();
            formData.append('file', file.data, file.name);
            // POST to /webhook/{API_KEY} with headers
            await axios.post(`${API_BASE_URL}/webhook/${API_KEY}`, formData, {
                headers: {
                    ...formData.getHeaders(),
                    'secret-key': API_SECRET,
                    'group-id': groupId,
                    'network': 'public',
                    'stamp-immediately': 'false'
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            });
            uploadedFiles.push(file.name);
        }
        await fs.writeFile(dirtyFile, '');
        res.json({
            status: 'success',
            message: `${uploadedFiles.length} file(s) uploaded successfully`,
            files: uploadedFiles
        });
    } catch (error) {
        console.error('Upload error:', error.response?.data || error.message);
        res.status(500).json({
            status: 'error',
            message: 'Error uploading files',
            error: error.response?.data || error.message
        });
    }
});

// Get uploaded files (from API group)
app.get('/files', async (req, res) => {
    try {
        const groupId = 'ScheduledUploads';
        const response = await axios.get(`${API_BASE_URL}/webhook/${API_KEY}`, {
            headers: {
                'secret-key': API_SECRET,
                'group-id': groupId,
                'network': 'public'
            }
        });
        res.json({ status: 'success', files: response.data.files || [] });
    } catch (error) {
        console.error('Error reading files:', error.response?.data || error.message);
        res.status(500).json({ status: 'error', message: 'Error reading uploaded files', error: error.response?.data || error.message });
    }
});

// Manual stamp endpoint
app.post('/stamp', async (req, res) => {
    try {
        const result = await stampCollection();
        res.json({
            status: 'success',
            message: 'Collection stamped successfully',
            result
        });
    } catch (error) {
        console.error('Stamping error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error stamping collection',
            error: error.message
        });
    }
});

// Check if collection is dirty
app.get('/dirty', async (req, res) => {
    try {
        const isDirty = await isCollectionDirty();
        res.json({
            status: 'success',
            isDirty
        });
    } catch (error) {
        console.error('Error checking dirty status:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error checking collection status'
        });
    }
});

// Helper functions
async function isCollectionDirty() {
    try {
        await fs.access(dirtyFile);
        return true;
    } catch {
        return false;
    }
}

async function stampCollection() {
    // Check if collection is dirty
    const isDirty = await isCollectionDirty();
    if (!isDirty) {
        console.log('Collection is not dirty, skipping stamp');
        return { message: 'Collection is not dirty, skipping stamp' };
    }
    const groupId = 'ScheduledUploads';
    try {
        // PATCH to /webhook/{API_KEY} with headers
        const response = await axios.patch(`${API_BASE_URL}/webhook/${API_KEY}`, {}, {
            headers: {
                'secret-key': API_SECRET,
                'group-id': groupId,
                'network': 'public'
            }
        });
        // Only remove .dirty file if stamping was successful
        await fs.unlink(dirtyFile);
        console.log('Collection stamped successfully, .dirty file removed');
        return {
            message: 'Collection stamped successfully',
            data: response.data
        };
    } catch (error) {
        console.error('Stamping failed:', error.response?.data || error.message);
        // Don't remove .dirty file if stamping failed
        throw new Error(`Stamping failed: ${error.response?.data?.message || error.message}`);
    }
}

// Scheduled stamping with node-cron
function setupScheduledStamping() {
    // Schedule stamping at noon (12:00) and midnight (00:00)
    cron.schedule('0 12,0 * * *', async () => {
        console.log('Running scheduled stamp...');
        try {
            await stampCollection();
        } catch (error) {
            console.error('Scheduled stamp failed:', error);
        }
    }, {
        timezone: 'UTC'
    });
    console.log('Scheduled stamping set up for noon and midnight UTC');
}

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Upload files to /upload endpoint');
    console.log('View files at /files endpoint');
    console.log('Manual stamp at /stamp endpoint');
    setupScheduledStamping();
}); 