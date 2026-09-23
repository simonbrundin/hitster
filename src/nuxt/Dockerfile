# ==============================
# Build Stage
# ==============================
FROM oven/bun:1.4.2-alpine AS build
WORKDIR /app

RUN apk add --no-cache python3 make g++ gcc

# Copy package metadata first for better layer caching.
COPY package.json bun.lock ./

RUN bun install --frozen-lockfile

# Copy source code after installing dependencies.
COPY . .

RUN bun run build

# ==============================
# Runtime Stage (minimal, secure)
# ==============================
FROM oven/bun:1.4.2-alpine AS production

WORKDIR /app

USER bun

COPY --from=build --chown=bun:bun /app/.output .

EXPOSE 3000

ENV HOST=0.0.0.0
ENV PORT=3000

CMD ["bun", "server/index.mjs"]
