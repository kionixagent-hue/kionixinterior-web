FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]

# Separate stage for the daily-article cron job — kept out of the lean `runner` image
# above (full node_modules + scripts + Claude Code CLI would bloat the web server image).
FROM node:20-alpine AS cron
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN apk add --no-cache tzdata
ENV TZ=Asia/Jakarta
# fontconfig + a real sans font — Alpine ships neither by default, so sharp/librsvg's
# SVG text compositing (scripts/social-post.js's slide overlays) silently renders empty
# tofu boxes instead of glyphs without this (confirmed live: font-family="sans-serif"
# resolved to nothing on a bare node:20-alpine).
RUN apk add --no-cache fontconfig ttf-dejavu && fc-cache -f
RUN npm install -g @anthropic-ai/claude-code
RUN printf '%s\n%s\n' \
      "0 6,16 * * * cd /app && node scripts/daily-article.js >> /proc/1/fd/1 2>&1" \
      "15 6,16 * * * cd /app && node scripts/social-post.js >> /proc/1/fd/1 2>&1" \
      > /etc/crontabs/root
CMD ["crond", "-f", "-l", "2"]
