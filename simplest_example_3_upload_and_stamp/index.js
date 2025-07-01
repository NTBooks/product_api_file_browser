require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

async function uploadAndStamp() {
    try {
        const formData = new FormData();
        formData.append('file', new Blob([new Date().toISOString()], { type: 'text/plain' }), 'timestamp.txt');

        const response = await fetch(`${process.env.API_BASE_URL}/webhook/${process.env.API_KEY}`, {
            method: 'POST',
            headers: {
                'secret-key': process.env.API_SECRET,
                'group-id': 'Timestamps',
                'network': 'public',
                'stamp-immediately': 'true'
            },
            body: formData
        });

        if (!response.ok) throw new Error(`Upload failed: ${response.status}`);

        const data = await response.json();
        console.log(`✅ Uploaded timestamp.txt (${data.hash})`);
        if (data.message) console.log(` ${data.message}`);
        if (data.files_stamped) console.log(`✅ Stamped ${data.files_stamped} files`);

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

uploadAndStamp(); 