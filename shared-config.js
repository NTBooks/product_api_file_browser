// Shared configuration for all API demos
require('dotenv').config();

module.exports = {
    API_BASE_URL: process.env.API_BASE_URL,
    API_KEY: process.env.API_KEY,
    API_SECRET: process.env.API_SECRET,
    API_NETWORK: process.env.API_NETWORK || 'public'
}; 