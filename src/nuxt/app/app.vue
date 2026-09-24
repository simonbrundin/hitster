<script setup lang="ts">
useHead({
  htmlAttrs: { lang: 'sv' },
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no' },
    { name: 'apple-mobile-web-app-capable', content: 'yes' },
    { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
    { name: 'mobile-web-app-capable', content: 'yes' },
    { name: 'theme-color', content: '#1a1a2e' }
  ]
})

const title = 'Hitster Battle'
const description = 'Online multiplayer music guessing game with Spotify. Challenge your friends in the ultimate music timeline game!'

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  twitterCard: 'summary_large_image'
})
</script>

<template>
  <NuxtPwaAssets />
  <UApp>
    <NuxtPage />
  </UApp>
</template>
