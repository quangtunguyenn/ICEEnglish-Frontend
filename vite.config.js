import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rolldownOptions: {
      output: {
        // Tách thư viện ít đổi để trình duyệt cache lâu, không tải lại mỗi lần deploy.
        codeSplitting: {
          groups: [
            { name: 'vendor-react', test: /node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/, priority: 30 },
            { name: 'vendor-charts', test: /node_modules[\\/](recharts|d3-[^\\/]+|victory-vendor|internmap)[\\/]/, priority: 20 },
            { name: 'vendor-editor', test: /node_modules[\\/](@tiptap|prosemirror-[^\\/]+|@remirror|linkifyjs|orderedmap|rope-sequence|w3c-keyname|markdown-it|entities|mdurl|uc\.micro|linkify-it)[\\/]/, priority: 20 },
          ],
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
