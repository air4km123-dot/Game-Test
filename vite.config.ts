import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: '/Game-Test/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon-192.svg', 'icon-512.svg'],
      manifest: {
        name: 'เคลียร์คุกกี้ — หนี้คุกกี้ต้องเคลียร์',
        short_name: 'เคลียร์คุกกี้',
        description: 'แอปบันทึกเกม UNO พักเที่ยง คำนวณและเคลียร์หนี้คุกกี้ให้อัตโนมัติ',
        lang: 'th',
        start_url: '/Game-Test/',
        scope: '/Game-Test/',
        id: '/Game-Test/',
        display: 'standalone',
        background_color: '#fdf1dc',
        theme_color: '#e0983c',
        icons: [
          {
            src: '/Game-Test/icon-192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: '/Game-Test/icon-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: '/Game-Test/icon-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,ico,png}'],
      },
    }),
  ],
})
