const axios = require('axios');
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: '../.env' });

// Configuration
const API_KEY = process.env.ADMIN_API_KEY || process.env.API_KEY;
const API_SECRET = process.env.API_SECRET;
const API_BASE_URL = process.env.API_BASE_URL || 'https://api.chainletter.io';

// Express app setup
const app = express();
const PORT = process.env.EXAMPLE_4_PORT || 3045;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Store connected clients for SSE
const clients = new Set();

if (!API_KEY || !API_SECRET) {
    console.error('❌ Error: API_KEY and API_SECRET must be set in environment variables');
    console.error('Please check your .env file or set the environment variables');
    process.exit(1);
}

console.log('🚀 Starting webhook event listener with browser streaming...');
console.log(`📡 Connecting to: ${API_BASE_URL}`);
console.log(`🔑 Using API Key: ${API_KEY.substring(0, 8)}...`);
console.log(`🌐 Browser interface: http://localhost:${PORT}`);
console.log('');

// Express routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// SSE endpoint for browser clients
app.get('/events/stream', (req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // Send initial connection message
    res.write(`data: ${JSON.stringify({
        type: 'connection.established',
        tenant_id: 'System',
        data: {
            message: 'Browser client connected to event stream'
        },
        timestamp: new Date().toISOString()
    })}\n\n`);

    // Add client to set
    clients.add(res);

    // Remove client when connection closes
    req.on('close', () => {
        clients.delete(res);
        console.log(`📱 Browser client disconnected. Active clients: ${clients.size}`);
    });

    console.log(`📱 Browser client connected. Active clients: ${clients.size}`);
});

// Function to broadcast events to all connected browser clients
function broadcastToClients(event) {
    const eventData = JSON.stringify(event);
    clients.forEach(client => {
        try {
            client.write(`data: ${eventData}\n\n`);
        } catch (error) {
            console.log('📱 Removing disconnected client');
            clients.delete(client);
        }
    });
}

// Function to connect to the webhook events stream
async function connectToEventStream() {
    try {
        console.log('🔌 Connecting to webhook events stream...');

        const response = await axios.get(`${API_BASE_URL}/webhook/${API_KEY}/events/stream`, {
            headers: {
                'secret-key': API_SECRET,
                'network': 'public' // Default network
            },
            responseType: 'stream',
            timeout: 60000 // 60 second timeout
        });

        console.log('✅ Connected to webhook events stream!');
        console.log('📊 Listening for events...');
        console.log('');

        // Handle the stream
        response.data.on('data', (chunk) => {
            const lines = chunk.toString().split('\n');

            lines.forEach(line => {
                if (line.trim() && line.startsWith('data: ')) {
                    try {
                        const eventData = line.substring(6); // Remove 'data: ' prefix
                        const event = JSON.parse(eventData);

                        // Format and display the event
                        displayEvent(event);
                    } catch (error) {
                        console.log('⚠️  Failed to parse event data:', line);
                    }
                }
            });
        });

        response.data.on('error', (error) => {
            console.error('❌ Stream error:', error.message);
            console.log('🔄 Attempting to reconnect in 5 seconds...');
            setTimeout(connectToEventStream, 5000);
        });

        response.data.on('end', () => {
            console.log('🔌 Stream ended, attempting to reconnect...');
            setTimeout(connectToEventStream, 5000);
        });

    } catch (error) {
        console.error('❌ Failed to connect to event stream:', error.message);

        if (error.response) {
            console.error('📊 Response status:', error.response.status);
            console.error('📊 Response data:', error.response.data);
        }

        console.log('🔄 Attempting to reconnect in 5 seconds...');
        setTimeout(connectToEventStream, 5000);
    }
}

// Function to display events in a formatted way
function displayEvent(event) {
    const timestamp = new Date().toLocaleTimeString();
    const eventType = event.type || 'unknown';
    const eventId = event.id || 'no-id';

    console.log(`\n📅 [${timestamp}] Event: ${eventType} (ID: ${eventId})`);

    // Display event data based on type
    switch (eventType) {
        case 'file.uploaded':
            console.log(`   📁 File uploaded: ${event.data?.name || 'Unknown'}`);
            console.log(`   🔗 Hash: ${event.data?.hash || 'Unknown'}`);
            console.log(`   📏 Size: ${event.data?.size ? formatBytes(event.data.size) : 'Unknown'}`);
            break;

        case 'file.pinned':
            console.log(`   📌 File pinned: ${event.data?.name || 'Unknown'}`);
            console.log(`   🔗 Hash: ${event.data?.hash || 'Unknown'}`);
            console.log(`   🌐 Gateway URL: ${event.data?.gatewayurl || 'Unknown'}`);
            break;

        case 'file.deleted':
            console.log(`   🗑️  File deleted: ${event.data?.name || 'Unknown'}`);
            console.log(`   🔗 Hash: ${event.data?.hash || 'Unknown'}`);
            break;

        case 'collection.stamped':
            console.log(`   🏷️  Collection stamped`);
            console.log(`   🔗 Group ID: ${event.data?.group_id || 'Unknown'}`);
            console.log(`   🆔 Transaction ID: ${event.data?.transaction_id || 'Unknown'}`);
            break;

        case 'connection.established':
            console.log(`   🔗 Connection established`);
            console.log(`   💬 Message: ${event.data?.message || 'No message'}`);
            break;

        default:
            console.log(`   📋 Data:`, JSON.stringify(event.data, null, 2));
    }

    // Show timestamp if available
    if (event.timestamp) {
        const eventTime = new Date(event.timestamp).toLocaleString();
        console.log(`   ⏰ Event time: ${eventTime}`);
    }

    console.log('   ' + '─'.repeat(50));

    // Broadcast to browser clients
    broadcastToClients(event);
}

// Function to format bytes
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Handle process termination
process.on('SIGINT', () => {
    console.log('\n👋 Shutting down event listener...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n👋 Shutting down event listener...');
    process.exit(0);
});

// Start the Express server
app.listen(PORT, () => {
    console.log(`🌐 Express server running on http://localhost:${PORT}`);
    console.log(`📱 Browser interface available at http://localhost:${PORT}`);
    console.log('');
});

// Start the event listener
connectToEventStream(); 