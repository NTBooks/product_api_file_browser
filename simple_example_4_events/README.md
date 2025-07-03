# Simple Webhook Event Listener

This is a simple Node.js application that connects to the webhook events stream and displays all events in real-time in the console.

## Features

- 🔌 **Real-time event streaming** - Connects to the webhook events stream
- 📊 **Formatted event display** - Shows events in a readable format with emojis and timestamps
- 🔄 **Auto-reconnection** - Automatically reconnects if the connection is lost
- 🛡️ **Error handling** - Graceful error handling and logging
- 📱 **Event types supported**:
  - `file.uploaded` - When a file is uploaded to IPFS
  - `file.pinned` - When a file is pinned and ready
  - `file.deleted` - When a file is deleted
  - `collection.stamped` - When a collection is stamped
  - `connection.established` - When the connection is established

## Setup

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Environment variables**:
   The app uses the same `.env` file from the root directory. Make sure you have:

   - `API_KEY` - Your API key
   - `API_SECRET` - Your API secret
   - `API_BASE_URL` - The API base URL (optional, defaults to https://api.chainletter.io)

3. **Run the app**:

   ```bash
   npm start
   ```

   Or for development with auto-restart:

   ```bash
   npm run dev
   ```

## Usage

Once running, the app will:

1. Connect to the webhook events stream
2. Display a connection status message
3. Show all incoming events in real-time
4. Automatically reconnect if the connection is lost

## Example Output

```
🚀 Starting webhook event listener...
📡 Connecting to: https://api.chainletter.io
🔑 Using API Key: e62540a1...

🔌 Connecting to webhook events stream...
✅ Connected to webhook events stream!
📊 Listening for events...

📅 [2:30:15 PM] Event: connection.established (ID: conn-123)
   🔗 Connection established
   💬 Message: Webhook connection established
   ⏰ Event time: 7/2/2025, 2:30:15 PM
   ──────────────────────────────────────────────────

📅 [2:30:20 PM] Event: file.uploaded (ID: file-456)
   📁 File uploaded: example.jpg
   🔗 Hash: QmX...abc123
   📏 Size: 1.25 MB
   ⏰ Event time: 7/2/2025, 2:30:20 PM
   ──────────────────────────────────────────────────

📅 [2:30:25 PM] Event: file.pinned (ID: file-789)
   📌 File pinned: example.jpg
   🔗 Hash: QmX...abc123
   🌐 Gateway URL: https://ipfs.io/ipfs/QmX...abc123
   ⏰ Event time: 7/2/2025, 2:30:25 PM
   ──────────────────────────────────────────────────
```

## Stopping the App

Press `Ctrl+C` to gracefully stop the event listener.

## Troubleshooting

- **Connection errors**: The app will automatically retry every 5 seconds
- **Missing environment variables**: Check that your `.env` file is properly configured
- **API errors**: Check your API credentials and network connection
