import axios from 'axios'

const API_BASE_URL = '/api'

// Configure axios to include credentials for session support
axios.defaults.withCredentials = true

// Add response interceptor to handle authentication errors
axios.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.data?.code === 'AUTH_ERROR' ||
            error.response?.status === 401 ||
            error.response?.status === 403) {
            // Clear any stored credentials on auth errors
            console.log('Authentication error detected, clearing credentials')
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
    // Create a simple text file as placeholder to create the group
    const blob = new Blob(['Group created'], { type: 'text/plain' })
    const file = new File([blob], 'group-created.txt', { type: 'text/plain' })

    const formData = new FormData()
    formData.append('file', file)
    formData.append('groupId', groupName)

    const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
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
export const uploadFile = async (file, groupId) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('groupId', groupId)

    const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    })

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
export const stampCollection = async (groupId) => {
    const response = await axios.patch(`${API_BASE_URL}/stamp`, {
        groupId
    })

    return response.data
}

// Get group statistics
export const getGroupStats = async (groupId) => {
    const response = await axios.get(`${API_BASE_URL}/group-stats/${groupId}`)
    return response.data
} 