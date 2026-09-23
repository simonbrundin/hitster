<script setup lang="ts">
definePageMeta({ layout: false })

useHead({
  title: 'Hitster Battle — Music timeline game',
  meta: [
    { name: 'description', content: 'Turn your Spotify playlists into a multiplayer music timeline game.' }
  ]
})

const { isAuthenticated, initFromStorage, logout } = useSpotify()
const { gameState } = useGame()

const features = [
  {
    icon: 'i-lucide-users',
    title: 'Teams, not accounts',
    description: 'Split into teams and invite everyone with one simple game code.'
  },
  {
    icon: 'i-lucide-headphones',
    title: 'Your soundtrack',
    description: 'Use a Spotify playlist everyone knows — or discover something new.'
  },
  {
    icon: 'i-lucide-trophy',
    title: 'One timeline to rule',
    description: 'Place songs in the right order and earn points for every good guess.'
  }
]

const gameSteps = [
  ['01', 'Create a room', 'Choose your teams and share the game code.'],
  ['02', 'Pick a playlist', 'Bring in the songs that will define your night.'],
  ['03', 'Build the timeline', 'Listen, guess and place each song by release year.']
]

onMounted(() => {
  initFromStorage()
})
</script>

<template>
  <div class="min-h-screen bg-[#f5f5f2] text-[#17211d]">
    <!-- Navigation -->
    <header class="sticky top-0 z-50 border-b border-[#17211d]/10 bg-[#f5f5f2]/95 backdrop-blur">
      <div class="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <NuxtLink
          to="/"
          class="flex items-center gap-2.5"
        >
          <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-[#17211d] text-[#b8f36b]">
            <Icon
              name="i-lucide-music-2"
              class="h-4 w-4"
            />
          </span>
          <span class="text-xs font-bold tracking-tight">HITSTER <span class="font-normal text-[#17211d]/45">BATTLE</span></span>
        </NuxtLink>

        <div class="flex items-center gap-3">
          <NuxtLink
            to="/setup-spotify"
            class="text-xs font-medium text-[#17211d]/55 hover:text-[#17211d]"
          >
            How to connect
          </NuxtLink>
          <ClientOnly>
            <NuxtLink
              v-if="isAuthenticated"
              to="/lobby"
              class="flex items-center gap-1.5 rounded-full bg-[#17211d] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#1db954] hover:text-[#17211d]"
            >
              <span>Play</span>
              <Icon
                name="i-lucide-arrow-right"
                class="h-3.5 w-3.5"
              />
            </NuxtLink>
          </ClientOnly>
        </div>
      </div>
    </header>

    <main>
      <!-- Hero -->
      <section class="mx-auto max-w-5xl px-4 py-10 sm:py-16">
        <div>
          <!-- Eyebrow -->
          <div class="mb-3 flex items-center gap-2">
            <span class="h-2 w-2 rounded-full bg-[#1db954]" />
            <span class="text-[10px] font-extrabold tracking-widest text-[#17211d]/50">ONLINE MUSIC TIMELINE</span>
          </div>

          <!-- Headline -->
          <h1 class="text-3xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-[3.5rem]">
            Turn your playlist into a
            <span class="text-[#1db954]">battlefield.</span>
          </h1>

          <!-- Subhead -->
          <p class="mt-3 max-w-md text-sm leading-relaxed text-[#17211d]/55 sm:mt-5 sm:text-base">
            Hitster Battle is the fast, chaotic music game for people who think they know when every song came out.
          </p>

          <!-- CTA buttons -->
          <ClientOnly>
            <div class="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:items-center sm:flex-wrap">
              <NuxtLink
                v-if="gameState?.status === 'playing'"
                to="/game"
                class="cta-primary"
              >
                Resume game
                <Icon
                  name="i-lucide-arrow-right"
                  class="h-4 w-4"
                />
              </NuxtLink>
              <NuxtLink
                v-else-if="isAuthenticated"
                to="/lobby"
                class="cta-primary"
              >
                Start a new game
                <Icon
                  name="i-lucide-arrow-right"
                  class="h-4 w-4"
                />
              </NuxtLink>
              <a
                v-else
                href="#connect"
                class="cta-primary"
              >
                Connect Spotify
                <Icon
                  name="i-lucide-arrow-down"
                  class="h-4 w-4"
                />
              </a>
            </div>

            <p
              v-if="gameState?.status === 'playing'"
              class="mt-3 text-xs font-medium text-[#1db954]"
            >
              Game code: <span class="font-mono">{{ gameState.code }}</span>
              · {{ gameState.cards.filter(c => !c.isRevealed).length }} cards left
            </p>
          </ClientOnly>

          <p class="mt-4 text-[10px] font-medium text-[#17211d]/35 sm:mt-6">
            2–4 teams · 10 minutes to learn · endless arguments
          </p>
        </div>
      </section>

      <!-- Connect card -->
      <section
        id="connect"
        class="mx-auto max-w-5xl px-4 pb-10 sm:pb-16"
      >
        <div class="connect-card">
          <div class="mb-5 flex items-start justify-between">
            <div>
              <p class="text-[10px] font-bold uppercase tracking-widest text-white/45">
                Ready to play?
              </p>
              <h2 class="mt-1.5 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Bring the music.
              </h2>
            </div>
            <span class="flex h-10 w-10 items-center justify-center rounded-full bg-[#1db954] text-white">
              <Icon
                name="i-simple-icons-spotify"
                class="h-5 w-5"
              />
            </span>
          </div>

          <ClientOnly>
            <div
              v-if="!isAuthenticated"
              class="spotify-login-wrap"
            >
              <SpotifyLogin compact />
            </div>

            <div
              v-else
              class="rounded-xl border border-white/10 bg-white/5 p-4"
            >
              <div class="flex items-center gap-3">
                <span class="flex h-9 w-9 items-center justify-center rounded-full bg-[#b8f36b] text-[#17211d]">
                  <Icon
                    name="i-lucide-check"
                    class="h-4 w-4"
                  />
                </span>
                <div>
                  <p class="font-semibold text-white">
                    Spotify is connected
                  </p>
                  <p class="mt-0.5 text-xs text-white/50">
                    Your playlists are ready to use.
                  </p>
                </div>
              </div>
              <div class="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <NuxtLink
                  to="/lobby"
                  class="card-action"
                >
                  Choose a playlist
                  <Icon
                    name="i-lucide-arrow-right"
                    class="h-4 w-4"
                  />
                </NuxtLink>
                <button
                  class="disconnect-btn"
                  @click="logout"
                >
                  <Icon
                    name="i-lucide-log-out"
                    class="h-4 w-4"
                  />
                  Disconnect
                </button>
              </div>
            </div>
          </ClientOnly>

          <NuxtLink
            v-if="!isAuthenticated"
            to="/setup-spotify"
            class="mt-4 flex items-center justify-center gap-1.5 text-xs text-white/35 transition hover:text-[#b8f36b]"
          >
            Need help setting up?
            <Icon
              name="i-lucide-arrow-up-right"
              class="h-3.5 w-3.5"
            />
          </NuxtLink>
        </div>
      </section>

      <!-- Feature band -->
      <section class="border-y border-[#17211d]/10 bg-white">
        <div class="mx-auto max-w-5xl divide-y divide-[#17211d]/10 px-4 sm:grid sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <article
            v-for="feature in features"
            :key="feature.title"
            class="feature-item"
          >
            <span class="feature-icon"><Icon
              :name="feature.icon"
              class="h-5 w-5"
            /></span>
            <div>
              <h2 class="text-sm font-semibold tracking-tight">
                {{ feature.title }}
              </h2>
              <p class="mt-1.5 text-xs leading-relaxed text-[#17211d]/55">
                {{ feature.description }}
              </p>
            </div>
          </article>
        </div>
      </section>

      <!-- How it works -->
      <section class="mx-auto max-w-5xl px-4 py-10 sm:py-16">
        <div class="sm:grid sm:grid-cols-[0.7fr_1.3fr] sm:gap-12">
          <div class="mb-8 sm:mb-0">
            <p class="eyebrow">
              HOW IT WORKS
            </p>
            <h2 class="mt-3 text-2xl font-semibold leading-tight tracking-tight text-[#17211d] sm:mt-4 sm:text-4xl">
              Simple rules.<br><span class="text-[#1db954]">Loud opinions.</span>
            </h2>
            <p class="mt-3 max-w-xs text-sm leading-relaxed text-[#17211d]/55">
              No trivia knowledge needed. Just listen closely, trust your instincts and place the song where you think it belongs.
            </p>
          </div>

          <div class="divide-y divide-[#17211d]/10">
            <div
              v-for="step in gameSteps"
              :key="step[0]"
              class="game-step"
            >
              <span class="step-num">{{ step[0] }}</span>
              <div>
                <h3 class="text-base font-semibold tracking-tight">
                  {{ step[1] }}
                </h3>
                <p class="mt-1 text-xs leading-relaxed text-[#17211d]/55">
                  {{ step[2] }}
                </p>
              </div>
              <Icon
                name="i-lucide-arrow-right"
                class="step-arrow"
              />
            </div>
          </div>
        </div>
      </section>
    </main>

    <footer class="border-t border-[#17211d]/10 px-4 py-5">
      <div class="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 text-[10px] font-medium text-[#17211d]/35 sm:flex-row">
        <span>HITSTER BATTLE</span>
        <span>Powered by Spotify · Built with Nuxt</span>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.16em;
  color: #17211d99;
}

.cta-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 999px;
  background: #17211d;
  color: white;
  font-size: 13px;
  font-weight: 650;
  padding: 13px 18px;
  transition: background 160ms, transform 160ms;
}
.cta-primary:hover {
  background: #1db954;
  color: #17211d;
  transform: translateY(-1px);
}

.connect-card {
  border-radius: 20px;
  background: #17211d;
  padding: 20px;
}

.spotify-login-wrap {
  border-radius: 14px;
  background: rgba(255,255,255,0.06);
  padding: 16px 12px;
}

.spotify-login-wrap :deep(h2) { font-size: 1.1rem; }
.spotify-login-wrap :deep(p) { color: rgba(255,255,255,0.5); font-size: 0.8rem; }
.spotify-login-wrap :deep(.text-center) { gap: 0.5rem; }
.spotify-login-wrap :deep(.text-spotify) { color: #1db954; }
.spotify-login-wrap :deep(.bg-spotify) { background: #1db954; }

.card-action {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 999px;
  background: #1db954;
  color: #17211d;
  font-size: 12px;
  font-weight: 650;
  padding: 9px 14px;
  transition: opacity 160ms;
}
.card-action:hover { opacity: 0.85; }

.disconnect-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.12);
  color: rgba(255,255,255,0.45);
  font-size: 12px;
  font-weight: 500;
  padding: 9px 14px;
  transition: color 160ms, border-color 160ms;
}
.disconnect-btn:hover {
  color: white;
  border-color: rgba(255,255,255,0.3);
}

.feature-item {
  display: flex;
  gap: 14px;
  padding: 20px 0;
}
@media (min-width: 640px) {
  .feature-item { padding: 24px 0; }
  .feature-item + .feature-item { padding-left: 24px; }
}

.feature-icon {
  display: flex;
  height: 36px;
  width: 36px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: #eef8e5;
  color: #1b9f4a;
}

.game-step {
  display: grid;
  grid-template-columns: 38px 1fr 20px;
  align-items: start;
  gap: 16px;
  padding: 18px 0;
}

.step-num {
  font-family: monospace;
  font-size: 10px;
  font-weight: 700;
  color: #1db954;
  padding-top: 2px;
}

.step-arrow {
  height: 16px;
  width: 16px;
  color: rgba(23,33,29,0.2);
  margin-top: 2px;
}
</style>
