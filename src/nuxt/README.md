# Hitster Battle

An online multiplayer music timeline game inspired by Hitster, built with Nuxt and Spotify integration.

## Features

- 🎵 **Spotify Integration** - Import your own playlists for gameplay
- 👥 **Multiplayer Teams** - Play with up to 4 teams
- ⭐ **Golden Shot** - Special bonus cards for extra points
- 🃏 **Hitster cards** - Skip a song, challenge an opponent, or trade three cards for a secured song
- 🎯 **Vertical music timeline** - Place one song at a time and verify each guess before deciding whether to bank or risk more
- 📱 **Responsive Design** - Works on desktop and mobile

## Getting Started

### Prerequisites

- Bun 1.4+
- A Spotify Developer account

### Setup

1. **Clone and install dependencies:**

```bash
cd src/nuxt
bun install
```

2. **Create a Spotify Application:**

   1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/)
   2. Create a new app
   3. Add `https://127.0.0.1:3000/callback` as a Redirect URI
   4. Copy your Client ID

3. **Configure environment variables:**

```bash
cp .env.example .env
```

Edit `.env` and add your Spotify credentials:

```
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
```

4. **Start the development server:**

```bash
bun dev
```

5. **Open [https://127.0.0.1:3000](https://127.0.0.1:3000)**

## How to Play

### Start a game

1. Connect Spotify and choose a playlist.
2. Create a game, set up teams, and share the game code so others can join.
3. The timeline starts with a locked reference song. The active team listens to one new song and places its card in the vertical timeline where they think its release year belongs.

### Officiella regler

Appen följer den svenska Original-versionen av Hitster:

- Varje lag börjar med **ett öppet musikkort** och **tre Hitsterkort/tokens**. Varje lag har sin egen tidslinje.
- DJ:n spelar en låt. Det aktiva laget får ett nytt musikkort med framsidan nedåt och placerar det på sin egen vertikala tidslinje.
- Kortet kan flyttas hur många gånger som helst innan laget trycker på **Rätta kortet**. År, låttitel, artist och omslag döljs tills kortet rättas.
- Rätt placering: laget behåller kortet på sin egen tidslinje. Kortet låses, ger 1 poäng och turen går vidare till nästa lag efter att resultatet har visats.
- Fel placering: kortet förloras och turen går vidare till nästa lag efter att resultatet har visats.
- Resultatet visas med en tydlig rätt/fel-animation. Spelaren klickar sedan på **Nästa låt** för att gå vidare.
- Det första laget som har 10 hits i rätt tidsordning vinner.

### Lås in-variant

När ett nytt spel skapas kan laget välja **Lås in-variant**:

- Ett rätt kort blir rätt men är fortfarande obankat.
- **Lås in** säkrar alla rätta kort från turen och skickar turen vidare.
- **Ta nästa låt** fortsätter samma lags tur.
- Om nästa gissning blir fel förloras alla rätta men olåsta kort från turen.

### Hitsterkort / tokens

Varje lag börjar med tre tokens:

1. **På lagets egen tur:** använd en token för att byta den aktuella låten mot en ny.
2. **På motståndarens tur:** utmana placeringen innan kortet rättas. Om utmaningen lyckas vinner laget kortet och placerar det på sin egen tidslinje. Om motståndaren hade rätt förbrukas token utan att laget får kortet.
3. **När som helst:** byt tre tokens mot ett säkrat musikkort som placeras på rätt plats utan att laget behöver gissa året.

I appen kan en motståndare utmana den aktuella placeringen med knappen **Utmana**. Tokens visas bredvid varje lag.

### Regler för årtal och låtversion

Året är året då den version som spelas först blev tillgänglig för allmänheten, digitalt eller fysiskt. Om låten är remastrad används originalets utgivningsår.

### Officiell svensk källa

- [HITSTER Nordic – Så här spelar du](https://nordics.hitstergame.com/sv-se/how-to-play/)
- [Hitster Original – How to play](https://hitstergame.com/en-us/pages/how-to-play-original)

## Project Structure

```
src/nuxt/
├── app/
│   ├── components/     # Vue components
│   │   ├── game/       # Game-related components
│   │   ├── spotify/    # Spotify UI components
│   │   └── team/       # Team management components
│   ├── composables/    # Vue composables (logic)
│   ├── pages/          # Route pages
│   ├── types/          # TypeScript types
│   └── assets/         # CSS and static files
├── server/
│   └── api/            # Server API routes
└── public/             # Static assets
```

## Tech Stack

- **Nuxt 4** - Vue 3 framework
- **Nuxt UI** - UI component library
- **Tailwind CSS** - Styling
- **TypeScript** - Type safety
- **Spotify Web API** - Music data

## Development

```bash
# Start development server
bun dev

# Build for production
bun run build

# Type check
bun run typecheck

# Lint
bun run lint
```

## License

MIT
