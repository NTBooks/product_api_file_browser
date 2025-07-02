const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const session = require('express-session');
const FormData = require('form-data');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true in production with HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Middleware
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());

// Configure multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// API base URL
const API_BASE_URL = process.env.API_BASE_URL;

// Check if hardcoded credentials are available
const hasHardcodedCredentials = () => {
    return !!(process.env.API_KEY && process.env.API_SECRET);
};

// Helper function to get stored credentials from session or environment
const getCredentialsFromSession = (req) => {
    // First check for hardcoded credentials
    if (hasHardcodedCredentials()) {
        return {
            apikey: process.env.API_KEY,
            secretKey: process.env.API_SECRET,
            network: process.env.API_NETWORK || 'public'
        };
    }

    // Fall back to session credentials
    if (!req.session.credentials) {
        throw new Error('API credentials not found. Please configure them in the dashboard.');
    }
    return req.session.credentials;
};

// Middleware to check if credentials are available
const requireCredentials = (req, res, next) => {
    try {
        getCredentialsFromSession(req);
        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            message: error.message,
            code: 'CREDENTIALS_REQUIRED'
        });
    }
};

// Middleware to handle API authentication errors
const handleApiError = (error, req, res) => {
    // Check if it's an authentication error
    if (error.response?.status === 401 || error.response?.status === 403) {
        // Clear session credentials if they exist
        if (req.session.credentials) {
            delete req.session.credentials;
        }

        return res.status(error.response.status).json({
            success: false,
            message: 'Authentication failed. Please check your credentials.',
            code: 'AUTH_ERROR'
        });
    }

    // Handle other API errors
    return res.status(error.response?.status || 500).json({
        success: false,
        message: error.response?.data?.message || error.message,
        code: 'API_ERROR'
    });
};

// Helper function to make API requests with error handling
const makeApiRequest = async (method, endpoint, headers = {}, data = null) => {
    try {
        const config = {
            method,
            url: `${API_BASE_URL}${endpoint}`,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        if (data) {
            config.data = data;
        }

        const response = await axios(config);
        return { success: true, data: response.data, headers: response.headers };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data || error.message,
            status: error.response?.status
        };
    }
};

// POST /api/credentials - Save API credentials to session (only if not hardcoded)
app.post('/api/credentials', (req, res) => {
    if (hasHardcodedCredentials()) {
        return res.status(400).json({
            success: false,
            message: 'Credentials are hardcoded in environment variables. Cannot override via API.'
        });
    }

    const { apikey, secretKey, network = 'public' } = req.body;

    if (!apikey || !secretKey) {
        return res.status(400).json({ success: false, message: 'API key and secret key are required' });
    }

    // Store credentials in session
    req.session.credentials = { apikey, secretKey, network };

    res.json({ success: true, message: 'Credentials saved successfully' });
});

// GET /api/credentials - Get current credentials info (for UI display)
app.get('/api/credentials', (req, res) => {
    try {
        const credentials = getCredentialsFromSession(req);

        if (hasHardcodedCredentials()) {
            // Return info about hardcoded credentials
            res.json({
                success: true,
                data: {
                    apikey: process.env.API_KEY.substring(0, 8) + '...',
                    network: process.env.API_NETWORK || 'public',
                    source: 'environment'
                }
            });
        } else {
            // Return info about session credentials
            res.json({
                success: true,
                data: {
                    apikey: credentials.apikey.substring(0, 8) + '...',
                    network: credentials.network,
                    source: 'session'
                }
            });
        }
    } catch (error) {
        res.status(404).json({ success: false, message: 'No credentials found' });
    }
});

// DELETE /api/credentials - Clear credentials from session (only if not hardcoded)
app.delete('/api/credentials', (req, res) => {
    if (hasHardcodedCredentials()) {
        return res.status(400).json({
            success: false,
            message: 'Credentials are hardcoded in environment variables. Cannot clear via API.'
        });
    }

    delete req.session.credentials;
    res.json({ success: true, message: 'Credentials cleared successfully' });
});

// GET /api/stats - Get tenant stats (HEAD request to external API)
app.get('/api/stats', requireCredentials, async (req, res) => {
    try {
        const { apikey, secretKey, network } = getCredentialsFromSession(req);

        const response = await axios.head(`${API_BASE_URL}/webhook/${apikey}`, {
            headers: {
                'secret-key': secretKey,
                'network': network
            }
        });

        const stats = {
            credits: parseInt(response.headers['x-credits']) || 0,
            groupEnabled: response.headers['x-group-enabled'] === 'true',
            groupExists: response.headers['x-group-exists'],
            groupPublic: response.headers['x-group-public'],
            stampedFiles: 0, // X-Stamped-Files header was removed, will be calculated from files list
            totalFiles: parseInt(response.headers['x-total-files']) || 0,
            totalSize: parseInt(response.headers['x-total-size']) || 0
        };

        res.json({ success: true, data: stats });
    } catch (error) {
        handleApiError(error, req, res);
    }
});

// GET /api/groups - Get all groups
app.get('/api/groups', requireCredentials, async (req, res) => {
    try {
        const { apikey, secretKey, network } = getCredentialsFromSession(req);

        const result = await makeApiRequest('GET', `/webhook/${apikey}`, {
            'secret-key': secretKey,
            'network': network
        });

        if (result.success) {
            console.log('Groups API response:', result.data); // Debug log
            res.json(result.data);
        } else {
            if (result.status === 401 || result.status === 403) {
                handleApiError({ response: { status: result.status } }, req, res);
            } else {
                res.status(result.status || 500).json(result.error);
            }
        }
    } catch (error) {
        handleApiError(error, req, res);
    }
});

// GET /api/files - Get files in a group
app.get('/api/files', requireCredentials, async (req, res) => {
    try {
        const { apikey, secretKey, network } = getCredentialsFromSession(req);
        const { groupId } = req.query;

        if (!groupId) {
            return res.status(400).json({ success: false, message: 'Group ID is required' });
        }

        const result = await makeApiRequest('GET', `/webhook/${apikey}`, {
            'secret-key': secretKey,
            'group-id': groupId,
            'network': network
        });

        if (result.success) {
            console.log('Files API response:', result.data); // Debug log
            res.json(result.data);
        } else {
            if (result.status === 401 || result.status === 403) {
                handleApiError({ response: { status: result.status } }, req, res);
            } else {
                res.status(result.status || 500).json(result.error);
            }
        }
    } catch (error) {
        handleApiError(error, req, res);
    }
});

// GET /api/file/:hash - Get file info by hash
app.get('/api/file/:hash', requireCredentials, async (req, res) => {
    try {
        const { apikey, secretKey, network } = getCredentialsFromSession(req);
        const { hash } = req.params;

        if (!hash) {
            return res.status(400).json({ success: false, message: 'Hash is required' });
        }

        const result = await makeApiRequest('GET', `/webhook/${apikey}`, {
            'secret-key': secretKey,
            'hash': hash,
            'network': network
        });

        if (result.success) {
            console.log('File detail API response:', result.data); // Debug log
            res.json(result.data);
        } else {
            if (result.status === 401 || result.status === 403) {
                handleApiError({ response: { status: result.status } }, req, res);
            } else {
                res.status(result.status || 500).json(result.error);
            }
        }
    } catch (error) {
        handleApiError(error, req, res);
    }
});

// POST /api/upload - Upload a file or create a group
app.post('/api/upload', requireCredentials, upload.single('file'), async (req, res) => {
    try {
        const { apikey, secretKey } = getCredentialsFromSession(req);

        // Debug logging
        console.log('Upload request body:', req.body);
        console.log('Upload request file:', req.file);

        // For file uploads, read from form fields; for group creation, read from JSON body
        const groupId = req.body.groupId || req.body.group_id;
        const network = req.body.network;

        console.log('Extracted groupId:', groupId);
        console.log('Extracted network:', network);

        if (!groupId) {
            return res.status(400).json({ success: false, message: 'Group ID is required' });
        }

        // Use network from request or fallback to session network
        const targetNetwork = network || getCredentialsFromSession(req).network;

        if (req.file) {
            // File upload - create group with file
            console.log('Processing file upload for group:', groupId);

            // Create FormData using the form-data package
            const formData = new FormData();
            formData.append('file', req.file.buffer, {
                filename: req.file.originalname,
                contentType: req.file.mimetype || 'application/octet-stream'
            });

            const response = await axios.post(`${API_BASE_URL}/webhook/${apikey}`, formData, {
                headers: {
                    'secret-key': secretKey,
                    'group-id': groupId,
                    'network': targetNetwork,
                    ...formData.getHeaders() // Include FormData headers
                }
            });

            res.json(response.data);
        } else {
            // Group creation without file
            console.log('Processing group creation for group:', groupId);

            const response = await axios.post(`${API_BASE_URL}/webhook/${apikey}`, {}, {
                headers: {
                    'secret-key': secretKey,
                    'group-id': groupId,
                    'network': targetNetwork,
                    'Content-Type': 'application/json'
                }
            });

            res.json(response.data);
        }
    } catch (error) {
        console.error('Upload error:', error);
        handleApiError(error, req, res);
    }
});

// DELETE /api/file - Delete a file
app.delete('/api/file', requireCredentials, async (req, res) => {
    try {
        const { apikey, secretKey, network } = getCredentialsFromSession(req);
        const { fileHash, groupId } = req.body;

        if (!fileHash || !groupId) {
            return res.status(400).json({ success: false, message: 'File hash and group ID are required' });
        }

        const result = await makeApiRequest('DELETE', `/webhook/${apikey}`, {
            'secret-key': secretKey,
            'group-id': groupId,
            'network': network
        }, {
            file_hash: fileHash
        });

        if (result.success) {
            res.json(result.data);
        } else {
            if (result.status === 401 || result.status === 403) {
                handleApiError({ response: { status: result.status } }, req, res);
            } else {
                res.status(result.status || 500).json(result.error);
            }
        }
    } catch (error) {
        handleApiError(error, req, res);
    }
});

// PATCH /api/stamp - Stamp collection
app.patch('/api/stamp', requireCredentials, async (req, res) => {
    try {
        const { apikey, secretKey, network } = getCredentialsFromSession(req);
        const { groupId, network: requestNetwork } = req.body;

        if (!groupId) {
            return res.status(400).json({ success: false, message: 'Group ID is required' });
        }

        // Use the network from the request if provided, otherwise fall back to session network
        // This ensures we stamp on the correct network where the group was created
        const targetNetwork = requestNetwork || network;

        console.log(`Stamping collection ${groupId} on network: ${targetNetwork} (request: ${requestNetwork}, session: ${network})`);

        const result = await makeApiRequest('PATCH', `/webhook/${apikey}`, {
            'secret-key': secretKey,
            'group-id': groupId,
            'network': targetNetwork
        });

        if (result.success) {
            res.json(result.data);
        } else {
            if (result.status === 401 || result.status === 403) {
                handleApiError({ response: { status: result.status } }, req, res);
            } else {
                res.status(result.status || 500).json(result.error);
            }
        }
    } catch (error) {
        handleApiError(error, req, res);
    }
});

// GET /api/group-stats/:groupId - Get group statistics (HEAD request to external API)
app.get('/api/group-stats/:groupId', requireCredentials, async (req, res) => {
    try {
        const { apikey, secretKey, network } = getCredentialsFromSession(req);
        const { groupId } = req.params;

        if (!groupId) {
            return res.status(400).json({ success: false, message: 'Group ID is required' });
        }

        const response = await axios.head(`${API_BASE_URL}/webhook/${apikey}`, {
            headers: {
                'secret-key': secretKey,
                'group-id': groupId,
                'network': network
            }
        });

        const stats = {
            totalFiles: parseInt(response.headers['x-total-files']) || 0,
            totalSize: parseInt(response.headers['x-total-size']) || 0
        };

        console.log(`Group ${groupId} stats:`, stats); // Debug log

        res.json({ success: true, data: stats });
    } catch (error) {
        handleApiError(error, req, res);
    }
});

// GET /ipfs - Proxy IPFS content to handle CORS and ORB issues
app.get('/ipfs', async (req, res) => {
    try {
        const { url } = req.query;

        if (!url) {
            return res.status(400).json({
                success: false,
                message: 'URL query parameter is required'
            });
        }

        console.log(`Proxying IPFS content from: ${url}`);

        const response = await axios.get(url, {
            responseType: 'stream',
            timeout: 10000,
            maxRedirects: 5,
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; FileBrowser/1.0)',
                'Accept': 'image/*,text/*,application/*,*/*',
                'Cookie': 'maint_bypass=p00pp00p'
            }
        });

        // Forward the response headers
        const contentType = response.headers['content-type'];
        const contentLength = response.headers['content-length'];
        const cacheControl = response.headers['cache-control'];
        const etag = response.headers['etag'];

        if (contentType) res.setHeader('Content-Type', contentType);
        if (contentLength) res.setHeader('Content-Length', contentLength);
        if (cacheControl) res.setHeader('Cache-Control', cacheControl);
        if (etag) res.setHeader('ETag', etag);

        // Set CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range');

        // Stream the response
        response.data.pipe(res);

    } catch (error) {
        console.error('IPFS proxy error:', error.message);

        res.status(500).json({
            success: false,
            message: 'Failed to fetch IPFS content',
            error: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    if (hasHardcodedCredentials()) {
        console.log('Using hardcoded credentials from environment variables');
    } else {
        console.log('Using session-based credentials');
    }
}); 