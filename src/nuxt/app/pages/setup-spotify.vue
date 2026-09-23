<script setup lang="ts">
definePageMeta({
  layout: false
})

useHead({
  title: 'Anslut Spotify — Hitster Battle',
  meta: [
    {
      name: 'description',
      content: 'Anslut din Spotify Developer-app för att börja spela Hitster Battle.'
    }
  ]
})

const redirectUri = computed(() => {
  if (import.meta.client) return `${window.location.origin}/callback`
  return 'https://127.0.0.1:3000/callback'
})
const copied = ref(false)

const steps = [
  { number: '01', label: 'Skapa en app' },
  { number: '02', label: 'Lägg till omdirigerings-URI' },
  { number: '03', label: 'Kopiera inloggningsuppgifter' },
  { number: '04', label: 'Börja spela' }
]

const copyRedirectUri = async () => {
  if (!import.meta.client) return

  await navigator.clipboard.writeText(redirectUri.value)
  copied.value = true
  window.setTimeout(() => {
    copied.value = false
  }, 2000)
}
</script>

<template>
  <div class="setup-page min-h-screen bg-[#f5f5f2] text-[#17211d]">
    <!-- Top navigation -->
    <header class="border-b border-[#17211d]/10 bg-[#f5f5f2]/90 backdrop-blur">
      <div class="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-8">
        <NuxtLink
          to="/"
          class="group flex items-center gap-3"
        >
          <span class="brand-mark flex h-9 w-9 items-center justify-center rounded-xl bg-[#17211d] text-[#b8f36b]">
            <Icon
              name="i-lucide-music-2"
              class="h-5 w-5"
            />
          </span>
          <span class="text-sm font-bold tracking-tight text-[#17211d]">
            HITSTER <span class="font-normal text-[#17211d]/50">BATTLE</span>
          </span>
        </NuxtLink>

        <NuxtLink
          to="/"
          class="inline-flex items-center gap-2 text-sm font-medium text-[#17211d]/60 transition hover:text-[#17211d]"
        >
          <Icon
            name="i-lucide-arrow-left"
            class="h-4 w-4"
          />
          Tillbaka till spelet
        </NuxtLink>
      </div>
    </header>

    <main>
      <!-- Hero -->
      <section class="mx-auto max-w-7xl px-5 pb-14 pt-16 lg:px-8 lg:pb-20 lg:pt-24">
        <div class="grid items-end gap-10 lg:grid-cols-[1fr_360px]">
          <div>
            <div class="mb-6 inline-flex items-center gap-2 rounded-full border border-[#17211d]/10 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#17211d]/60 shadow-sm">
              <span class="h-2 w-2 rounded-full bg-[#1db954]" />
              Spotify-anslutning
            </div>
            <h1 class="max-w-3xl text-5xl font-semibold leading-[0.98] tracking-[-0.06em] text-[#17211d] sm:text-6xl lg:text-8xl">
              Din musik.<br>
              <span class="text-[#1db954]">Ditt spel.</span>
            </h1>
            <p class="mt-7 max-w-xl text-lg leading-8 text-[#17211d]/60">
              Skapa en Spotify Developer-app på några minuter, och anslut sedan dina spellistor till Hitster Battle.
            </p>
          </div>

          <div class="rounded-3xl bg-[#17211d] p-6 text-white shadow-[0_20px_60px_rgba(23,33,29,0.18)] lg:p-7">
            <div class="mb-8 flex items-start justify-between">
              <div>
                <p class="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">
                  Installationstid
                </p>
                <p class="mt-2 text-4xl font-semibold tracking-tight">
                  ~ 5 min
                </p>
              </div>
              <Icon
                name="i-simple-icons-spotify"
                class="h-8 w-8 text-[#1db954]"
              />
            </div>
            <div class="space-y-3 text-sm text-white/65">
              <div class="flex items-center gap-3">
                <Icon
                  name="i-lucide-check"
                  class="h-4 w-4 text-[#b8f36b]"
                /> Ingen kodning krävs
              </div>
              <div class="flex items-center gap-3">
                <Icon
                  name="i-lucide-check"
                  class="h-4 w-4 text-[#b8f36b]"
                /> Fungerar lokalt på din dator
              </div>
              <div class="flex items-center gap-3">
                <Icon
                  name="i-lucide-check"
                  class="h-4 w-4 text-[#b8f36b]"
                /> Din hemlighet förblir privat
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Content -->
      <section class="border-t border-[#17211d]/10 bg-white">
        <div class="mx-auto grid max-w-7xl gap-12 px-5 py-14 lg:grid-cols-[190px_1fr] lg:px-8 lg:py-20">
          <aside class="lg:sticky lg:top-8 lg:self-start">
            <p class="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-[#17211d]/40">
              På denna sida
            </p>
            <nav class="space-y-3 border-l border-[#17211d]/10 pl-4">
              <a
                v-for="step in steps"
                :key="step.number"
                :href="`#step-${step.number}`"
                class="block text-sm text-[#17211d]/50 transition hover:text-[#1db954]"
              >
                <span class="mr-2 font-mono text-xs text-[#17211d]/30">{{ step.number }}</span>{{ step.label }}
              </a>
            </nav>
            <a
              href="https://developer.spotify.com/dashboard/"
              target="_blank"
              rel="noreferrer"
              class="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[#1db954] hover:underline"
            >
              Öppna Spotify Dashboard
              <Icon
                name="i-lucide-arrow-up-right"
                class="h-4 w-4"
              />
            </a>
          </aside>

          <div class="max-w-3xl">
            <div class="mb-12 rounded-2xl border border-[#e5e7e2] bg-[#f5f5f2] p-5 sm:p-6">
              <div class="flex gap-4">
                <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#b8f36b] text-[#17211d]">
                  <Icon
                    name="i-lucide-sparkles"
                    class="h-4 w-4"
                  />
                </div>
                <div>
                  <h2 class="font-semibold">
                    Innan du börjar
                  </h2>
                  <p class="mt-1 text-sm leading-6 text-[#17211d]/60">
                    Du behöver ett Spotify-konto och Hitster Battle-projektet körs lokalt. Håll denna sida öppen medan du konfigurerar appen.
                  </p>
                </div>
              </div>
            </div>

            <!-- Step 1 -->
            <article
              id="step-01"
              class="setup-step"
            >
              <div class="step-number">
                01
              </div>
              <div class="step-content">
                <p class="step-kicker">
                  Först och främst
                </p>
                <h2>Skapa en Spotify-app</h2>
                <p>Öppna Spotify Developer Dashboard och logga in med ditt Spotify-konto.</p>
                <a
                  href="https://developer.spotify.com/dashboard/"
                  target="_blank"
                  rel="noreferrer"
                  class="primary-action"
                >
                  Öppna Developer Dashboard
                  <Icon
                    name="i-lucide-arrow-up-right"
                    class="h-4 w-4"
                  />
                </a>
                <div class="tip-box">
                  <Icon
                    name="i-lucide-lightbulb"
                    class="h-4 w-4 shrink-0 text-[#1db954]"
                  />
                  <span>Klicka på <strong>Skapa app</strong>. Använd "Hitster Battle" som appnamn. Beskrivningen kan vara vad som helst.</span>
                </div>
              </div>
            </article>

            <!-- Step 2 -->
            <article
              id="step-02"
              class="setup-step"
            >
              <div class="step-number">
                02
              </div>
              <div class="step-content">
                <p class="step-kicker">
                  Anslut inloggningsflödet
                </p>
                <h2>Lägg till omdirigerings-URI</h2>
                <p>I din nya app öppnar du <strong>Inställningar</strong> och letar upp avsnittet för omdirigerings-URI:er. Lägg till denna exakta adress:</p>
                <button
                  class="copy-field"
                  type="button"
                  @click="copyRedirectUri"
                >
                  <code>{{ redirectUri }}</code>
                  <span class="copy-label">
                    <Icon
                      :name="copied ? 'i-lucide-check' : 'i-lucide-copy'"
                      class="h-4 w-4"
                    />
                    {{ copied ? 'Kopierat' : 'Kopiera' }}
                  </span>
                </button>
                <div class="warning-box">
                  <Icon
                    name="i-lucide-triangle-alert"
                    class="h-4 w-4 shrink-0 text-[#b27600]"
                  />
                  <span>Adressen måste matcha exakt — inklusive <code>http://</code> och <code>/callback</code>. Klicka på Spara i Spotify när du är klar.</span>
                </div>
              </div>
            </article>

            <!-- Step 3 -->
            <article
              id="step-03"
              class="setup-step"
            >
              <div class="step-number">
                03
              </div>
              <div class="step-content">
                <p class="step-kicker">
                  Flytta över inloggningsuppgifterna
                </p>
                <h2>Kopiera ditt Client ID</h2>
                <p>Stanna i dina appinställningar och kopiera <strong>Client ID</strong>. Lägg till det i <code>.env</code>-filen i Nuxt-projektet:</p>
                <div class="code-block">
                  <div><span class="code-key">SPOTIFY_CLIENT_ID</span><span class="code-muted">=</span><span class="code-value">your_client_id_here</span></div>
                  <div><span class="code-key">SPOTIFY_CLIENT_SECRET</span><span class="code-muted">=</span><span class="code-value">your_client_secret_here</span></div>
                </div>
                <div class="tip-box">
                  <Icon
                    name="i-lucide-shield-check"
                    class="h-4 w-4 shrink-0 text-[#1db954]"
                  />
                  <span>Client Secret är känsligt. Ladda aldrig upp det till Git eller klistra in det i webbläsaren.</span>
                </div>
              </div>
            </article>

            <!-- Step 4 -->
            <article
              id="step-04"
              class="setup-step last-step"
            >
              <div class="step-number">
                04
              </div>
              <div class="step-content">
                <p class="step-kicker">
                  Redo när du är
                </p>
                <h2>Starta om och anslut</h2>
                <p>Spara din <code>.env</code>-fil, starta om utvecklingsservern och logga in från startsidan.</p>
                <div class="code-block command-block">
                  <span class="code-prompt">$</span> bun dev
                </div>
                <NuxtLink
                  to="/"
                  class="primary-action"
                >
                  Gå till Hitster Battle
                  <Icon
                    name="i-lucide-arrow-right"
                    class="h-4 w-4"
                  />
                </NuxtLink>
              </div>
            </article>

            <div class="mt-16 border-t border-[#17211d]/10 pt-8">
              <p class="text-sm text-[#17211d]/50">
                Något som inte fungerar?
                <a
                  href="https://developer.spotify.com/documentation/web-api"
                  target="_blank"
                  rel="noreferrer"
                  class="font-semibold text-[#1db954] hover:underline"
                >Läs Spotifys Web API-dokumentation</a>
                eller kontrollera att din omdirigerings-URI och inloggningsuppgifter matchar exakt.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.setup-page {
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
}

.setup-step {
  display: grid;
  grid-template-columns: 56px 1fr;
  gap: 24px;
  position: relative;
  padding-bottom: 64px;
}

.setup-step:not(.last-step)::after {
  content: '';
  position: absolute;
  left: 27px;
  top: 48px;
  bottom: 0;
  width: 1px;
  background: #17211d1a;
}

.step-number {
  position: relative;
  z-index: 1;
  display: flex;
  width: 56px;
  height: 56px;
  align-items: center;
  justify-content: center;
  border-radius: 18px;
  background: #17211d;
  color: #b8f36b;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 13px;
  font-weight: 700;
}

.step-content h2 {
  margin-top: 6px;
  font-size: clamp(1.65rem, 3vw, 2.25rem);
  font-weight: 600;
  letter-spacing: -0.045em;
  color: #17211d;
}

.step-content > p:not(.step-kicker) {
  max-width: 620px;
  margin-top: 12px;
  color: #17211d99;
  line-height: 1.75;
}

.step-kicker {
  color: #1db954;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.primary-action {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  margin-top: 24px;
  border-radius: 999px;
  background: #17211d;
  padding: 12px 17px;
  color: white;
  font-size: 14px;
  font-weight: 600;
  transition: transform 160ms ease, background 160ms ease;
}

.primary-action:hover {
  background: #1db954;
  color: #17211d;
  transform: translateY(-1px);
}

.tip-box,
.warning-box {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  max-width: 620px;
  margin-top: 22px;
  border-radius: 14px;
  padding: 14px 16px;
  font-size: 13px;
  line-height: 1.6;
}

.tip-box {
  background: #f1f8e9;
  color: #17211db3;
}

.warning-box {
  background: #fff7e5;
  color: #70531c;
}

.copy-field,
.code-block {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  max-width: 620px;
  margin-top: 24px;
  border: 1px solid #17211d1a;
  border-radius: 14px;
  background: #f5f5f2;
  padding: 16px;
  text-align: left;
}

.copy-field code,
.code-block {
  overflow-x: auto;
  color: #17211d;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 13px;
  white-space: nowrap;
}

.copy-label {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 6px;
  margin-left: 16px;
  color: #1db954;
  font-size: 12px;
  font-weight: 700;
}

.code-block {
  display: block;
  line-height: 2;
}

.code-key { color: #176b3a; }
.code-muted { color: #17211d66; padding: 0 5px; }
.code-value { color: #a15d00; }
.code-prompt { color: #1db954; margin-right: 8px; }

@media (max-width: 640px) {
  .setup-step {
    grid-template-columns: 42px 1fr;
    gap: 16px;
  }

  .step-number {
    width: 42px;
    height: 42px;
    border-radius: 14px;
    font-size: 11px;
  }

  .setup-step:not(.last-step)::after {
    left: 20px;
    top: 42px;
  }
}
</style>
