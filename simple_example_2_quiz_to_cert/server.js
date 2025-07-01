const express = require('express');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const envPath = path.resolve(__dirname, '../.env');
console.log('Looking for .env at:', envPath);
require('dotenv').config({ path: envPath });

const app = express();
const PORT = process.env.PORT || 3002;

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
        const certPath = path.join(__dirname, 'cert.jpg');
        await fs.writeFile(certPath, certBuffer);

        // Upload certificate file (creates collection if it doesn't exist)
        const collectionName = 'Course Complete';
        const FormData = require('form-data');
        const formData = new FormData();
        formData.append('file', certBuffer, {
            filename: 'cert.jpg',
            contentType: 'image/jpeg'
        });
        formData.append('groupId', collectionName);

        console.log('Uploading certificate...');
        console.log('Certificate buffer size:', certBuffer.length);
        console.log('Collection name:', collectionName);

        let fileHash = 'unknown';

        try {
            const uploadResponse = await fetch(`${API_BASE_URL}/webhook/${API_KEY}`, {
                method: 'POST',
                headers: {
                    'secret-key': API_SECRET,
                    'group-id': collectionName,
                    'network': API_NETWORK
                },
                body: formData
            });

            console.log('Upload response status:', uploadResponse.status);

            if (!uploadResponse.ok) {
                const errorText = await uploadResponse.text();
                console.error('Failed to upload certificate:', uploadResponse.status);
                console.error('Error response:', errorText);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to upload certificate',
                    error: errorText
                });
            }

            const uploadData = await uploadResponse.json();
            console.log('Upload successful:', uploadData);
            fileHash = uploadData?.hash || 'unknown';
        } catch (error) {
            console.error('Failed to upload certificate:', error.message);
            return res.status(500).json({
                success: false,
                message: 'Failed to upload certificate'
            });
        }

        // Stamp the collection after uploading the certificate
        try {
            const stampResponse = await fetch(`${API_BASE_URL}/webhook/${API_KEY}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'secret-key': API_SECRET,
                    'group-id': collectionName,
                    'network': API_NETWORK
                }
            });

            if (stampResponse.ok) {
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
        console.error('Quiz submission error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// API endpoint to check file status
app.get('/api/file-status/:hash', async (req, res) => {
    try {
        const { hash } = req.params;

        if (!hash) {
            return res.status(400).json({
                success: false,
                message: 'File hash is required'
            });
        }

        // Get all files in the "Course Complete" collection
        try {
            const response = await fetch(`${API_BASE_URL}/webhook/${API_KEY}`, {
                method: 'GET',
                headers: {
                    'secret-key': API_SECRET,
                    'network': API_NETWORK,
                    'group-id': 'Course Complete'
                }
            });

            if (response.ok) {
                const data = await response.json();

                if (data.files) {
                    // Find the specific file by hash
                    const targetFile = data.files.find(file => file.hash === hash);

                    if (targetFile) {
                        res.json({
                            success: true,
                            data: targetFile
                        });
                    } else {
                        res.status(404).json({
                            success: false,
                            message: 'File not found in collection',
                            error: 'File hash not found in Course Complete collection'
                        });
                    }
                } else {
                    res.status(500).json({
                        success: false,
                        message: 'Invalid response format',
                        error: 'No files array in response'
                    });
                }
            } else {
                res.status(response.status).json({
                    success: false,
                    message: 'Failed to get collection files',
                    error: `HTTP ${response.status}`
                });
            }
        } catch (error) {
            console.error('File status check error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get collection files',
                error: error.message
            });
        }

    } catch (error) {
        console.error('File status check error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

app.listen(PORT, () => {
    console.log(`Quiz Certificate Demo running on port ${PORT}`);
    console.log(`API Key: ${API_KEY ? 'Configured' : 'Missing'}`);
    console.log(`API Secret: ${API_SECRET ? 'Configured' : 'Missing'}`);
    console.log(`Network: ${API_NETWORK}`);
}); 