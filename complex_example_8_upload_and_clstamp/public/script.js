// Configuration for IPFS hash calculation
const multihashSettings = {
    strategy: "balanced",
    rawLeaves: false,
    onlyHash: true,
    reduceSingleLeafToSelf: true,
    hashAlg: "sha2-256",
    leafType: "file",
    cidVersion: 0,
    shardSplitThreshold: 1000,
    fileImportConcurrency: 50,
    blockWriteConcurrency: 10,
    minChunkSize: 262144,
    maxChunkSize: 262144,
    avgChunkSize: 262144,
    window: 16,
    polynomial: 17437180132763652,
    maxChildrenPerNode: 174,
    layerRepeat: 4,
    wrapWithDirectory: false,
    pin: false,
    recursive: false,
    hidden: false,
    preload: false,
    hamtHashCode: 34,
    hamtBucketBits: 8,
    testN: 0,
};

// Mock block store for hash-only calculation
const block = {
    get: async (cid) => { },
    put: async () => { },
};

// Main hash calculation function
const cid_hash = async (content, options) => {
    options = options || {};
    options.onlyHash = true;

    if (typeof content === "string") {
        content = new TextEncoder().encode(content);
    }

    let lastCid;
    for await (const { cid } of IpfsUnixfsImporter.importer(
        { content },
        block,
        options
    )) {
        lastCid = cid;
    }

    return `${lastCid}`;
};

// Calculate both IPFS CID and SHA-256
async function calcHashes(data) {
    if (data.length === 0) {
        throw new Error("File is empty");
    }

    const ipfs_cid = await cid_hash(new Uint8Array(data), multihashSettings);
    const sha = await crypto.subtle.digest("SHA-256", data);

    const hashArray = Array.from(new Uint8Array(sha));
    const hashHex = hashArray
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

    const NULL_CID = "QmbFMke1KXqnYyBBWxB74N4c5SBnJMVAiMNRcGu6x1AwQH";
    if (NULL_CID === ipfs_cid) {
        throw new Error("NULL CID!");
    }

    return { ipfs_cid, sha: hashHex };
}

// Upload file to local Node.js backend
async function uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('groupId', 'Uploads');
    formData.append('network', 'public');
    formData.append('stamp-immediately', 'true');

    const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
}

// Create zip file with the original file and hash information
function createzip(file, ipfs_cid, sha) {
    var zip = new JSZip();

    console.log("Creating stamp file for:", file.name);

    zip.file("hash.txt", ipfs_cid.toString());
    zip.file("sha.txt", sha);
    zip.file("manifest.txt", file.name);
    zip.file(file.name, file);

    zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: {
            level: 6
        }
    }).then(function (content) {
        console.log("Downloading stamp file...");
        // Force download of the Zip file
        saveAs(content, `${file.name}.zip.clstamp`);
    });

    return zip;
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Update UI status
function updateStatus(text, className = '') {
    const statusElement = document.getElementById('uploadStatusText');
    statusElement.textContent = text;
    statusElement.className = className;
}

// Update loading text
function updateLoadingText(text) {
    const loadingElement = document.getElementById('loadingText');
    if (loadingElement) {
        loadingElement.textContent = text;
    }
}

// Handle file processing
async function processFile(file) {
    const reader = new FileReader();

    reader.onload = async function (e) {
        try {
            const data = new Uint8Array(e.target.result);

            // Step 1: Calculate hashes
            updateLoadingText("Calculating hashes...");
            const { ipfs_cid, sha } = await calcHashes(data);

            // Display file info and hashes
            document.getElementById('fileName').textContent = file.name;
            document.getElementById('fileSize').textContent = formatFileSize(file.size);
            document.getElementById('ipfsHash').textContent = ipfs_cid;
            document.getElementById('shaHash').textContent = sha;

            // Step 2: Upload to IPFS via local backend
            updateLoadingText("Uploading to IPFS...");
            updateStatus("Uploading...", "status-uploading");

            try {
                const uploadResult = await uploadFile(file);
                console.log("Upload successful:", uploadResult);
                updateStatus("Upload successful!", "status-success");
            } catch (uploadError) {
                console.warn("Upload failed, but continuing with stamp file creation:", uploadError);
                updateStatus("Upload failed, but stamp file will be created", "status-error");
            }

            // Step 3: Create and prepare stamp file for download
            updateLoadingText("Creating stamp file...");

            // Store the stamp file creation function for the download button
            window.createStampFile = () => {
                createzip(file, ipfs_cid, sha);
            };

            // Show download section
            document.getElementById('downloadSection').style.display = 'block';

            // Hide loading and show result
            document.getElementById('loading').style.display = 'none';
            document.getElementById('result').classList.add('show');

        } catch (error) {
            console.error('Error processing file:', error);
            document.getElementById('loading').style.display = 'none';
            document.getElementById('result').classList.add('show', 'error');
            updateStatus("Error processing file", "status-error");
            document.getElementById('result').innerHTML = `
                <div style="color: #c53030;">
                    <strong>Error:</strong> ${error.message}
                </div>
            `;
        }
    };

    reader.readAsArrayBuffer(file);
}

// Event listeners
document.addEventListener('DOMContentLoaded', function () {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const result = document.getElementById('result');
    const loading = document.getElementById('loading');
    const downloadButton = document.getElementById('downloadButton');

    // Click to upload
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });

    // File input change
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            // Hide previous results and show loading
            result.classList.remove('show', 'error');
            loading.style.display = 'block';
            document.getElementById('downloadSection').style.display = 'none';

            // Process the file
            processFile(file);
        }
    });

    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');

        const file = e.dataTransfer.files[0];
        if (file) {
            // Hide previous results and show loading
            result.classList.remove('show', 'error');
            loading.style.display = 'block';
            document.getElementById('downloadSection').style.display = 'none';

            // Process the file
            processFile(file);
        }
    });

    // Download button click
    downloadButton.addEventListener('click', () => {
        if (window.createStampFile) {
            window.createStampFile();
        }
    });
}); 