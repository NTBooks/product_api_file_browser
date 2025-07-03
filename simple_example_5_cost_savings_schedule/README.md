# Cost-Saving Scheduled Stamping Example

This example demonstrates a cost-saving approach to file stamping by batching uploads and only stamping collections twice daily (noon and midnight) instead of immediately after each upload.

## 🎯 How It Saves Money

- **Batch Processing**: Instead of stamping each file individually (which costs per stamp), files are collected and stamped as a collection
- **Scheduled Stamping**: Collections are only stamped twice daily (noon and midnight) to minimize API calls
- **Smart Tracking**: Uses a `.dirty` flag file to track when collections need stamping
- **Manual Override**: Users can manually stamp collections when needed

## 🚀 Quick Start

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Set up environment:**

   ```bash
   cp ../env.example .env
   # Edit .env with your API key
   ```

3. **Start the server:**

   ```bash
   npm start
   ```

4. **Open your browser:**
   ```
   http://localhost:3000
   ```

## 📁 How It Works

### File Upload Flow

1. Users upload files through the web interface
2. Files are stored in the `uploads/` directory
3. A `.dirty` flag file is created to mark the collection as needing stamping
4. Files are **NOT** stamped immediately (cost savings!)

### Scheduled Stamping

- **Automatic**: Collections are stamped at noon and midnight if `.dirty` exists
- **Smart**: Only stamps if there are unstamped changes
- **Resilient**: If stamping fails, `.dirty` file is preserved for retry

### Manual Stamping

- Users can manually trigger stamping via the web interface
- Useful for urgent files or testing

## 🛠️ API Endpoints

- `GET /` - Web interface
- `POST /upload` - Upload files (multipart/form-data)
- `GET /files` - List uploaded files
- `POST /stamp` - Manually stamp collection
- `GET /dirty` - Check if collection needs stamping

## 📊 Cost Comparison

| Approach               | Stamps per day | Cost    |
| ---------------------- | -------------- | ------- |
| Immediate stamping     | 100+           | High    |
| **Scheduled stamping** | **2**          | **Low** |

## 🔧 Configuration

The server runs on `process.env.PORT` or defaults to port 3000.

## 📝 File Structure

```
simple_example_5_cost_savings_schedule/
├── server.js              # Express server with file upload
├── public/
│   └── index.html         # Web interface
├── uploads/               # Uploaded files (created automatically)
├── .dirty                 # Flag file (created when files need stamping)
├── package.json
└── README.md
```

## 🎨 Features

- **Modern UI**: Clean, responsive web interface
- **File Management**: View uploaded files with details
- **Real-time Status**: See if collection needs stamping
- **Progress Indicators**: Upload progress and loading states
- **Error Handling**: Graceful error handling and user feedback

## 💡 Usage Tips

1. **Upload files** through the web interface
2. **Monitor status** - the UI shows if collection needs stamping
3. **Wait for automatic stamping** at noon/midnight, or
4. **Manual stamp** if you need immediate processing

## 🔒 Security Notes

- File uploads are limited to 50MB per file
- Files are stored locally in the `uploads/` directory
- Consider implementing authentication for production use

## 🚨 Troubleshooting

- **Stamping fails**: Check your API key in `.env`
- **Files not uploading**: Check file size limits and permissions
- **Server won't start**: Ensure port is available and dependencies are installed
