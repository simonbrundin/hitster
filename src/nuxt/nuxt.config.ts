// https://nuxt.com/docs/api/configuration/nuxt-config
import { fileURLToPath } from 'node:url'

export default defineNuxtConfig({
  modules: ['@nuxt/eslint', '@nuxt/ui', '@nuxt/image'],

  devtools: {
    enabled: false
  },

  app: {
    head: {
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
  }
})
