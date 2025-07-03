# Upload & Create Stamp File

This application combines file upload functionality with IPFS stamp file creation. It allows users to:

1. Upload a file to IPFS via the API using a local Node.js server
2. Calculate IPFS CID and SHA-256 hashes in the browser
3. Create a downloadable `.zip.clstamp` file containing verification data

## Features

- **File Upload**: Drag & drop or click to select files
- **IPFS Upload**: Automatically uploads files to IPFS via local server
- **Hash Calculation**: Calculates both IPFS CID and SHA-256 hashes
- **Stamp File Creation**: Creates a `.zip.clstamp` file containing:
  - Original file
  - `hash.txt` with IPFS CID
  - `sha.txt` with SHA-256 hash
  - `manifest.txt` with original filename
- **Download Link**: Provides a download button for the stamp file after processing

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure API Credentials

Create a `.env` file in the parent directory with your API credentials:

```env
API_BASE_URL=your_api_base_url
API_KEY=your_api_key
API_SECRET=your_api_secret
```

### 3. Run the Application

```bash
npm start
```

The application will be available at `http://localhost:3001`

## Usage

1. **Start the server**: Run `npm start`
2. **Open browser**: Navigate to `http://localhost:3001`
3. **Upload File**: Drag and drop a file or click the upload area to select one
4. **Processing**: The app will:
   - Calculate IPFS CID and SHA-256 hashes
   - Upload the file to IPFS via the local server
   - Prepare the stamp file for download
5. **Download**: Click the "Download .zip.clstamp File" button to get your stamp file

## File Structure

The generated `.zip.clstamp` file contains:

```
your-file.zip.clstamp/
├── your-file.ext          # Original uploaded file
├── hash.txt              # IPFS CID
├── sha.txt               # SHA-256 hash
└── manifest.txt          # Original filename
```

## Architecture

- **Frontend**: HTML/CSS/JavaScript with drag & drop interface
- **Backend**: Express.js server that handles file uploads to IPFS
- **Hash Calculation**: Client-side IPFS hash calculation using ipfs-unixfs-importer
- **Stamp File Creation**: Client-side zip creation using JSZip

## Available Scripts

- `npm start` - Start the Express server
- `npm run dev` - Start the server with nodemon for development
- `npm run upload` - Run the standalone upload script (index.js)

## Error Handling

- If the API upload fails, the stamp file will still be created locally
- All errors are displayed in the UI with clear messages
- The application continues processing even if one step fails

## Dependencies

### Frontend (CDN)

- `ipfs-unixfs-importer` - For IPFS hash calculation
- `jszip` - For creating zip files
- `file-saver` - For downloading files

### Backend (npm)

- `express` - Web server
- `multer` - File upload handling
- `form-data` - Form data creation
- `node-fetch` - HTTP requests
- `dotenv` - Environment variable management

## Browser Compatibility

This application works in modern browsers that support:

- ES6+ JavaScript
- File API
- Fetch API
- Web Crypto API
