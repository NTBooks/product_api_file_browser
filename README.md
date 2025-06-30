# File Browser Application

A modern file browser application built with React, Material UI, and Express.js that provides a comprehensive interface for managing files and groups through the Chainletter Credential Server Webhook API.

## Features

- **Dashboard**: View account statistics and configure API credentials
- **Groups View**: Browse all available groups in a grid layout with folder icons
- **Files View**: Display files within a group with image previews and file management
- **File Detail View**: Detailed file information with preview images and verification data
- **File Upload**: Upload files to specific groups
- **File Deletion**: Delete unstamped files
- **Collection Stamping**: Stamp entire collections of files
- **Modern UI**: Beautiful Material UI design with responsive layout
- **Secure Credential Management**: Server-side session storage with automatic cleanup
- **Environment Variable Support**: Hardcoded credentials for deployment scenarios

## Security Features

### Credential Management

- **Server-side Sessions**: API credentials are stored securely on the server, not in browser localStorage
- **Automatic Cleanup**: Invalid credentials are automatically cleared when authentication fails
- **Environment Variables**: Support for hardcoded credentials in deployment environments
- **Session Validation**: Middleware ensures credentials are available for all protected routes

### Authentication Error Handling

- **401/403 Detection**: Automatically detects and handles authentication failures
- **Session Clearing**: Invalid sessions are cleared when API returns authentication errors
- **User Feedback**: Clear error messages guide users to reconfigure credentials

## Project Structure

```
product_api_file_browser/
├── client/                 # React frontend
│   ├── src/
│   │   ├── pages/         # React components
│   │   ├── services/      # API service functions
│   │   ├── App.jsx        # Main app component
│   │   └── main.jsx       # React entry point
│   ├── package.json       # Frontend dependencies
│   └── vite.config.js     # Vite configuration
├── server/                # Express backend
│   ├── server.js          # Express server with API routes
│   ├── package.json       # Backend dependencies
│   └── env.example        # Environment variables template
├── package.json           # Root package.json with scripts
└── README.md             # This file
```

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn

## Installation

1. **Clone the repository**:

   ```bash
   git clone <repository-url>
   cd product_api_file_browser
   ```

2. **Install all dependencies**:

   ```bash
   npm run install-all
   ```

   This will install dependencies for:

   - Root project (concurrently)
   - Client (React, Material UI, etc.)
   - Server (Express, etc.)

3. **Configure environment variables** (optional):
   ```bash
   cd server
   cp env.example .env
   # Edit .env with your configuration
   ```

## Environment Configuration

### For Development

Create a `.env` file in the `server/` directory:

```env
# Session configuration
SESSION_SECRET=your-super-secret-session-key-change-in-production

# Optional: Hardcoded API credentials for deployment
# Uncomment and set these if you want to hardcode credentials
# API_KEY=your-api-key-here
# API_SECRET=your-api-secret-here
# API_NETWORK=public

# Server configuration
PORT=3001
```

### For Production Deployment

Set environment variables for hardcoded credentials:

```env
API_KEY=your-production-api-key
API_SECRET=your-production-api-secret
API_NETWORK=public
SESSION_SECRET=your-production-session-secret
```

When hardcoded credentials are set:

- Users cannot modify credentials via the UI
- Credentials are automatically available without configuration
- The UI shows "Environment Variables" as the credential source

## Running the Application

### Development Mode

Start both the client and server simultaneously:

```bash
npm run dev
```

This will start:

- **Client**: http://localhost:3000 (React development server)
- **Server**: http://localhost:3001 (Express API server)

### Individual Commands

You can also run the client and server separately:

```bash
# Start only the client
npm run client

# Start only the server
npm run server
```

## Configuration

1. **Open the application** in your browser at `http://localhost:3000`

2. **Configure API credentials** (if not using environment variables):

   - API Key: Your webhook API key
   - Secret Key: Your webhook secret key
   - Network: Choose between public, private, or all

3. **Save the configuration** to start using the application

## Usage

### Dashboard

- View account statistics (total files, stamped files, credits, etc.)
- Configure API credentials (if not hardcoded)
- Monitor system status
- See credential source (Session Storage or Environment Variables)

### Groups

- Browse all available groups in a grid view
- Click on any group to view its files
- Each group shows creation date, user ID, and network type
- Create new groups with specified network type

### Files

- View all files in a selected group
- Upload new files using the upload button
- Stamp entire collections using the "Stamp Collection" button
- Click on any file to view detailed information
- Image files (jpg, jpeg, png) show previews

### File Details

- View comprehensive file information
- See file verification data and blockchain details
- Download files directly
- Delete unstamped files (stamped files cannot be deleted)
- Copy hashes and transaction IDs to clipboard

## API Integration

The application integrates with the Chainletter Credential Server Webhook API and supports all major operations:

- **HEAD** `/webhook/{apikey}` - Get tenant stats
- **GET** `/webhook/{apikey}` - List groups, files, or get file info
- **POST** `/webhook/{apikey}` - Upload files
- **DELETE** `/webhook/{apikey}` - Delete files
- **PATCH** `/webhook/{apikey}` - Stamp collections

## Security Implementation

### Server-Side Security

- **Session Management**: Uses express-session for secure credential storage
- **Middleware Protection**: All API routes require valid credentials
- **Error Handling**: Automatic session cleanup on authentication failures
- **CORS Configuration**: Properly configured for development and production

### Client-Side Security

- **No Local Storage**: Credentials are never stored in browser localStorage
- **Axios Interceptors**: Automatic handling of authentication errors
- **Error Feedback**: Clear user guidance when credentials are invalid

## Technologies Used

### Frontend

- **React 18** - UI framework
- **Material UI 5** - Component library and styling
- **React Router 6** - Client-side routing
- **Vite** - Build tool and development server
- **Axios** - HTTP client with interceptors

### Backend

- **Express.js** - Web framework
- **express-session** - Session management
- **CORS** - Cross-origin resource sharing
- **Multer** - File upload handling
- **Axios** - HTTP client for API calls

## Development

### Project Scripts

```bash
# Install all dependencies
npm run install-all

# Start development servers
npm run dev

# Build for production
npm run build

# Start only client
npm run client

# Start only server
npm run server
```

### File Structure Details

#### Client (`/client`)

- **Pages**: React components for each route
- **Services**: API service functions with error handling
- **App.jsx**: Main application component with routing
- **main.jsx**: React entry point with theme provider

#### Server (`/server`)

- **server.js**: Express server with middleware and session management
- **API Routes**: Protected routes with credential validation
- **Error Handling**: Centralized authentication error handling

## Troubleshooting

### Common Issues

1. **Port conflicts**: If ports 3000 or 3001 are in use, the application will fail to start
2. **API credentials**: Make sure to configure valid API credentials in the dashboard
3. **CORS issues**: The server is configured to allow all origins in development
4. **Session errors**: Clear browser cookies if experiencing session issues

### Error Messages

- **"API credentials not found"**: Configure your API key and secret in the dashboard
- **"Authentication failed"**: Check your credentials or clear session and reconfigure
- **"Failed to fetch"**: Check your internet connection and API credentials
- **"File not found"**: The requested file may not exist or you may not have access

### Environment Variable Issues

- **"Credentials are hardcoded"**: Cannot modify credentials when using environment variables
- **"No credentials found"**: Check your .env file configuration

## Deployment

### Production Considerations

1. **Environment Variables**: Use hardcoded credentials for production deployments
2. **Session Secret**: Use a strong, unique session secret
3. **HTTPS**: Enable secure cookies in production
4. **CORS**: Configure proper CORS settings for your domain

### Example Production .env

```env
SESSION_SECRET=your-super-secure-production-session-secret
API_KEY=your-production-api-key
API_SECRET=your-production-api-secret
API_NETWORK=public
PORT=3001
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
