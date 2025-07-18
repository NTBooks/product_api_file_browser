const express = require('express');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const axios = require('axios');
const envPath = path.resolve(__dirname, '../.env');
console.log('Looking for .env at:', envPath);
require('dotenv').config({ path: envPath });

const app = express();
const PORT = process.env.EX2_PORT || 3042;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// API configuration
const API_BASE_URL = process.env.API_BASE_URL;
const API_KEY = process.env.API_KEY;
const API_SECRET = process.env.API_SECRET;
const API_NETWORK = process.env.API_NETWORK || 'public';

// Quiz questions
const quizQuestions = [
    {
        question: "What is 5 + 3?",
        options: ["6", "7", "8", "9"],
        correct: 2
    },
    {
        question: "What is 12 + 7?",
        options: ["18", "19", "20", "21"],
        correct: 1
    },
    {
        question: "What is 25 + 15?",
        options: ["35", "40", "45", "50"],
        correct: 1
    }
];



// Generate certificate with name and date
async function generateCertificate(name) {
    const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Create a simple certificate template
    const svgTemplate = `
        <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
            <rect width="800" height="600" fill="#f8f9fa" stroke="#dee2e6" stroke-width="2"/>
            <rect x="50" y="50" width="700" height="500" fill="white" stroke="#007bff" stroke-width="3"/>
            
            <!-- Header -->
            <text x="400" y="120" text-anchor="middle" font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="#007bff">
                Certificate of Completion
            </text>
            
            <!-- Subtitle -->
            <text x="400" y="160" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="#6c757d">
                Mathematics Quiz
            </text>
            
            <!-- Main text -->
            <text x="400" y="250" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" fill="#212529">
                This is to certify that
            </text>
            
            <!-- Name -->
            <text x="400" y="300" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#007bff">
                ${name}
            </text>
            
            <!-- Completion text -->
            <text x="400" y="350" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" fill="#212529">
                has successfully completed the Mathematics Quiz
            </text>
            
            <text x="400" y="380" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" fill="#212529">
                with a perfect score.
            </text>
            
            <!-- Date -->
            <text x="400" y="450" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#6c757d">
                Date: ${currentDate}
            </text>
            
            <!-- Footer -->
            <text x="400" y="520" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#6c757d">
                Certificate ID: ${Date.now()}
            </text>
        </svg>
    `;

    // Convert SVG to PNG using Sharp
    const buffer = await sharp(Buffer.from(svgTemplate))
        .png()
        .toBuffer();

    return buffer;
}

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/complete', (req, res) => {
    res.sendFile(path.join(__dirname, 'complete.html'));
});

// API endpoint to get quiz questions
app.get('/api/quiz', (req, res) => {
    res.json({ questions: quizQuestions });
});

// API endpoint to submit quiz answers
app.post('/api/submit-quiz', async (req, res) => {
    try {
        const { name, answers } = req.body;

        if (!name || !answers || answers.length !== quizQuestions.length) {
            return res.status(400).json({
                success: false,
                message: 'Name and all answers are required'
            });
        }

        // Check answers
        let correctAnswers = 0;
        for (let i = 0; i < quizQuestions.length; i++) {
            if (answers[i] === quizQuestions[i].correct) {
                correctAnswers++;
            }
        }

        const isPerfect = correctAnswers === quizQuestions.length;

        if (!isPerfect) {
            return res.json({
                success: true,
                perfect: false,
                score: correctAnswers,
                total: quizQuestions.length,
                message: `You got ${correctAnswers} out of ${quizQuestions.length} correct. Try again for a perfect score!`
            });
        }

        // Generate certificate
        const certBuffer = await generateCertificate(name);
        const certPath = path.join(__dirname, 'cert.png');
        await fs.writeFile(certPath, certBuffer);

        // Upload certificate file (creates collection if it doesn't exist)
        const collectionName = 'Cert Demo';
        const FormData = require('form-data');
        const formData = new FormData();
        formData.append('file', certBuffer, {
            filename: 'cert.png',
            contentType: 'image/png'
        });

        console.log('Uploading certificate...');
        console.log('Certificate buffer size:', certBuffer.length);
        console.log('Collection name:', collectionName);

        let fileHash = 'unknown';

        const response = await axios.post(`${API_BASE_URL}/webhook/${API_KEY}`, formData, {
            headers: {
                'secret-key': API_SECRET,
                'group-id': collectionName,
                'network': API_NETWORK,
                ...formData.getHeaders() // Include FormData headers
            }
        });

        console.log('Upload response status:', response.status);
        console.log('Upload successful:', response.data);
        fileHash = response.data?.hash || 'unknown';

        // Stamp the collection after uploading the certificate
        try {
            const stampResponse = await axios.patch(`${API_BASE_URL}/webhook/${API_KEY}`, {}, {
                headers: {
                    'Content-Type': 'application/json',
                    'secret-key': API_SECRET,
                    'group-id': collectionName,
                    'network': API_NETWORK
                }
            });

            if (stampResponse.status === 200) {
                console.log('Collection stamped successfully');
            } else {
                console.error('Failed to stamp collection:', stampResponse.status);
            }
        } catch (error) {
            console.error('Failed to stamp collection:', error.message);
        }

        res.json({
            success: true,
            perfect: true,
            score: correctAnswers,
            total: quizQuestions.length,
            message: 'Perfect score! Your certificate has been generated and uploaded.',
            fileHash: fileHash
        });

    } catch (error) {
        console.error('Quiz submission error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to process quiz submission',
            error: error.message
        });
    }
});

// API endpoint to get file info from group (includes gatewayurl)
app.get('/api/file-info/:hash', async (req, res) => {
    try {
        const { hash } = req.params;

        if (!hash) {
            return res.status(400).json({
                success: false,
                message: 'File hash is required'
            });
        }

        // Get file info from group (includes gatewayurl)
        const response = await axios.get(`${API_BASE_URL}/webhook/${API_KEY}`, {
            headers: {
                'secret-key': API_SECRET,
                'network': API_NETWORK,
                'group-id': 'Cert Demo'
            }
        });

        if (response.status !== 200) {
            return res.status(response.status).json({
                success: false,
                message: 'Failed to get collection files',
                error: `HTTP ${response.status}`
            });
        }

        const data = response.data;

        if (!data.files) {
            return res.status(500).json({
                success: false,
                message: 'Invalid response format',
                error: 'No files array in response'
            });
        }

        // Find the specific file by hash
        const targetFile = data.files.find(file => file.hash === hash);

        if (!targetFile) {
            return res.status(404).json({
                success: false,
                message: 'File not found in collection',
                error: 'File hash not found in Cert Demo collection'
            });
        }

        res.json({
            success: true,
            data: targetFile
        });

    } catch (error) {
        console.error('File info check error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to get file info',
            error: error.message
        });
    }
});

// API endpoint to check file status (blockchain details)
app.get('/api/file-status/:hash', async (req, res) => {
    try {
        const { hash } = req.params;

        if (!hash) {
            return res.status(400).json({
                success: false,
                message: 'File hash is required'
            });
        }

        // Get specific file status with blockchain info and export links
        const response = await axios.get(`${API_BASE_URL}/webhook/${API_KEY}`, {
            headers: {
                'secret-key': API_SECRET,
                'network': API_NETWORK,
                'hash': hash,
                'group-id': 'Cert Demo',
                'export-links': 'true'
            }
        });

        if (response.status !== 200) {
            return res.status(response.status).json({
                success: false,
                message: 'Failed to get file status',
                error: `HTTP ${response.status}`
            });
        }

        const data = response.data;
        // If this was a fallback response, add null claim_link to indicate export-links failed
        if (data && data.data && !response.config.headers['export-links']) {
            data.data.claim_link = null;
        }

        res.json({
            success: true,
            data: data
        });

    } catch (error) {
        console.error('File status check error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to get file status',
            error: error.message
        });
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
    console.log(`Quiz Certificate Demo running on port http://localhost:${PORT}`);
    console.log(`API Key: ${API_KEY ? 'Configured' : 'Missing'}`);
    console.log(`API Secret: ${API_SECRET ? 'Configured' : 'Missing'}`);
    console.log(`Network: ${API_NETWORK}`);
}); 