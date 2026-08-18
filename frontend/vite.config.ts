import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'isomorphic-ws': path.resolve(__dirname, './src/ws-polyfill.ts'),
    },
  },
  server: {
    fs: {
      allow: ['.', '../contracts/managed', '../src']
    }
  }
})
