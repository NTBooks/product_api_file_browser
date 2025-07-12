import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        port: process.env.EX1_PORT || 3040,
        proxy: {
            '/api': {
                target: `http://localhost:${process.env.EX1_SERVER_PORT || 3041}`,
                changeOrigin: true
            }
        }
    }
}) 