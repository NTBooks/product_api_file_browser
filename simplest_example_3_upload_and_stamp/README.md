# Minimal API Demo

The simplest possible example of the Chainletter API: create a timestamp file, upload it, and stamp the collection.

## Setup

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Configure API credentials:**

   ```bash
   cp env.example .env
   # Edit .env with your API credentials
   ```

3. **Run the demo:**
   ```bash
   npm start
   ```

## What it does

1. Creates a timestamp string with current date/time
2. Uploads it as `timestamp.txt` to the "Timestamp Demo" collection
3. Automatically stamps the collection in the same API call using the `stamp-immediately` header

## Output

```
✅ Created timestamp content
✅ Uploaded timestamp.txt
   File hash: QmHash...
✅ Stamped 1 files
   Stamp hash: pm_hash_abc123
🎉 Demo completed successfully!
```

## Files

- `index.js` - Single file with all the logic
- `package.json` - Minimal dependencies
- `.env` - API credentials (create from env.example)

Perfect for displaying as a code sample on your homepage!
