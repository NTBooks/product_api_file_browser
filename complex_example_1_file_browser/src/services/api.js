import axios from 'axios'

const API_BASE_URL = '/api'

// Configure axios to include credentials for session support
axios.defaults.withCredentials = true

// Configure axios to handle redirects properly
axios.defaults.maxRedirects = 5 // Allow up to 5 redirects
axios.defaults.validateStatus = (status) => {
    // Accept 2xx, 3xx, and 409 status codes (including redirects and file conflicts)
    return (status >= 200 && status < 400) || status === 409
}

// Add response interceptor to handle authentication errors and redirects
axios.interceptors.response.use(
    (response) => {
        // Handle 302 redirects by following them
        if (response.status === 302 && response.headers.location) {
            // The browser will automatically follow the redirect
            return response
        }
        return response
    },
    (error) => {
        if (error.response?.data?.code === 'AUTH_ERROR' ||
            error.response?.status === 401 ||
            error.response?.status === 403) {
            // Clear any stored credentials on auth errors
        }

        // Log redirect errors for debugging
        if (error.response?.status === 302) {
            // Handle redirect errors silently
        }

        return Promise.reject(error)
    }
)

// Save credentials to server session
export const saveCredentials = async (apikey, secretKey, network = 'public') => {
    const response = await axios.post(`${API_BASE_URL}/credentials`, {
        apikey, secretKey, network
    })
    return response.data
}

// Get current credentials info (non-sensitive)
export const getCredentialsInfo = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/credentials`)
        return response.data
    } catch (error) {
        if (error.response?.status === 404) {
            return { success: false, message: 'No credentials found' }
        }
        throw error
    }
}

// Clear credentials from server session
export const clearCredentials = async () => {
    const response = await axios.delete(`${API_BASE_URL}/credentials`)
    return response.data
}

// Check if credentials are set
export const hasCredentials = async () => {
    try {
        const response = await getCredentialsInfo()
        return response.success
    } catch (error) {
        return false
    }
}

// Get tenant stats
export const getStats = async () => {
    const response = await axios.get(`${API_BASE_URL}/stats`)
    return response.data
}

// Get all groups
export const getGroups = async () => {
    const response = await axios.get(`${API_BASE_URL}/groups`)
    return response.data
}

// Create a new group
export const createGroup = async (groupName, network) => {
    const response = await axios.post(`${API_BASE_URL}/upload`, {
        groupId: groupName,
        network: network || 'public'
    }, {
        headers: {
            'Content-Type': 'application/json'
        }
    })

    return response.data
}

// Get files in a group
export const getFiles = async (groupId) => {
    const response = await axios.get(`${API_BASE_URL}/files`, {
        params: { groupId }
    })
    return response.data
}

// Get file info by hash
export const getFileInfo = async (hash) => {
    const response = await axios.get(`${API_BASE_URL}/file/${hash}`)
    return response.data
}

// Upload a file
export const uploadFile = async (file, groupId, network) => {
    // Validate that file is a proper File object
    if (!file || !(file instanceof File)) {
        throw new Error('Invalid file object provided');
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('groupId', groupId)
    formData.append('network', network)

    const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    })

    // Handle 409 Conflict as a successful response with existing file data
    if (response.status === 409) {
        return response.data;
    }

    return response.data
}

// Delete a file
export const deleteFile = async (fileHash, groupId) => {
    const response = await axios.delete(`${API_BASE_URL}/file`, {
        data: { fileHash, groupId }
    })

    return response.data
}

// Stamp collection
export const stampCollection = async (groupId, network) => {
    const response = await axios.patch(`${API_BASE_URL}/stamp`, {
        groupId,
        network
    })

    return response.data
}

// Get group statistics
export const getGroupStats = async (groupId) => {
    const response = await axios.get(`${API_BASE_URL}/group-stats/${groupId}`)
    return response.data
}

