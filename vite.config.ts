import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Relative base so the build works both at a domain root (Netlify) and in a
// GitHub Pages subpath (https://user.github.io/lesson-tracker/).
export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'Lesson Tracker',
        short_name: 'Lessons',
        description: "A teacher's planner for lessons and finances",
        theme_color: '#f5f1e8',
        background_color: '#f5f1e8',
        display: 'standalone',
        orientation: 'portrait',
        start_url: './',
        scope: './',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // Never cache Supabase API calls -- the app's own offline layer owns that.
        navigateFallbackDenylist: [/^\/api/],
      },
    }),
  ],
})
