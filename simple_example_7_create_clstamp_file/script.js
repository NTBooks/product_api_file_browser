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

// Create zip file with the original file and hash information
function createzip(file, ipfs_cid, sha) {
    var zip = new JSZip();

    console.log("FILE", file);

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
        console.log("DOWNLOAD!", FileSaver);
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

// Handle file processing
async function processFile(file) {
    const reader = new FileReader();

    reader.onload = async function (e) {
        try {
            const data = new Uint8Array(e.target.result);
            const { ipfs_cid, sha } = await calcHashes(data);

            // Display results
            document.getElementById('fileName').textContent = file.name;
            document.getElementById('fileSize').textContent = formatFileSize(file.size);
            document.getElementById('ipfsHash').textContent = ipfs_cid;
            document.getElementById('shaHash').textContent = sha;

            // Create and download the zip file
            createzip(file, ipfs_cid, sha);

            // Show result and hide loading
            document.getElementById('loading').style.display = 'none';
            document.getElementById('result').classList.add('show');

        } catch (error) {
            console.error('Error calculating hash:', error);
            document.getElementById('loading').style.display = 'none';
            document.getElementById('result').classList.add('show', 'error');
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

            // Process the file
            processFile(file);
        }
    });
}); 