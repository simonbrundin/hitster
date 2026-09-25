// https://nuxt.com/docs/api/configuration/nuxt-config
import { fileURLToPath } from 'node:url'

export default defineNuxtConfig({
  modules: ['@nuxt/eslint', '@nuxt/ui', '@nuxt/image', '@vite-pwa/nuxt'],

  devtools: {
    enabled: false
  },

  app: {
    head: {
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'theme-color', content: '#1a1a2e' }
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        {
          rel: 'preconnect',
          href: 'https://fonts.gstatic.com',
          crossorigin: ''
        },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'
        }
      ]
    }
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    appUrl: process.env.APP_URL || '',
    spotifyClientId:
      process.env.SPOTIFY_CLIENT_ID || process.env.VITE_SPOTIFY_CLIENT_ID || '',
    spotifyClientSecret: process.env.SPOTIFY_CLIENT_SECRET || '',
    public: {
      appUrl: process.env.APP_URL || '',
      spotifyClientId:
        process.env.SPOTIFY_CLIENT_ID
        || process.env.VITE_SPOTIFY_CLIENT_ID
        || ''
    }
  },

  routeRules: {
    '/game': { ssr: false },
    '/lobby': { ssr: false },
    '/results': { ssr: false },
    '/join/**': { ssr: false }
  },

  devServer: {
    https: {
      key: fileURLToPath(new URL('../certs/key.pem', import.meta.url)),
      cert: fileURLToPath(new URL('../certs/cert.pem', import.meta.url))
    },
    host: '0.0.0.0'
  },

  compatibilityDate: '2026-06-30',

  nitro: {
    preset: 'bun',
    storage: {
      games: {
        driver: 'fs',
        base: './data/games'
      }
    }
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  pwa: {
    registerWebManifestOnRoot: true,
    manifest: {
      name: 'Hitster Battle',
      short_name: 'Hitster',
      description: 'Online multiplayer music guessing game with Spotify',
      theme_color: '#1a1a2e',
      background_color: '#1a1a2e',
      display: 'standalone',
      orientation: 'portrait',
      start_url: '/',
      icons: [
        {
          src: '/icon-192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: '/icon-512.png',
          sizes: '512x512',
          type: 'image/png'
        },
        {
          src: '/apple-touch-icon.png',
          sizes: '180x180',
          type: 'image/png'
        }
      ]
    },
    devOptions: {
      enabled: true,
      suppressWarnings: true,
      navigateFallback: '/',
      type: 'module'
    },
    workbox: {
      navigateFallbackDenylist: [/^\/api\//]
    }
  }
})
