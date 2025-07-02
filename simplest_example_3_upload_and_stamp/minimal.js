(async () => {
    const formData = new FormData();
    formData.append('file', new Blob(["Hello World! The Current Time is: " + new Date().toISOString()],
        { type: 'text/plain' }), 'hello.txt');

    const response = await fetch(`{YOUR_WEBHOOK_URL}`, {
        method: 'POST',
        headers: {
            'secret-key': '{YOUR_SECRET_KEY}',
            'group-id': 'Timestamps',
            'network': 'public',
            'stamp-immediately': 'true'
        },
        body: formData
    });

    const data = await response.json();

    console.log(`✅ Stamped ${data.files_stamped} files!`);

})();