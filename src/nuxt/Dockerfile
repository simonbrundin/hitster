# ==============================
# Build Stage
# ==============================
FROM node:22-alpine AS build
WORKDIR /app

RUN apk add --no-cache python3 make g++ gcc

# Kopiera package files
COPY package.json pnpm-lock.yaml* ./

# Installera pnpm globalt
RUN npm install -g pnpm

# Installera beroenden (cache-vänligt)
RUN pnpm install --frozen-lockfile

# Kopiera källkod (efter install för bättre cache)
COPY . .

# Bygg applikationen
RUN pnpm run build

# ==============================
# Runtime Stage (minimal, säker)
# ==============================
FROM node:22-alpine AS production

WORKDIR /app

# Kör Nitro med Node.js
USER node

# Kopiera bara det som behövs för runtime
COPY --from=build --chown=node:node /app/.output .

EXPOSE 3000

ENV HOST=0.0.0.0
ENV PORT=3000

CMD ["node", "server/index.mjs"]
