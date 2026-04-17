# --- STAGE 1: Build Frontend ---
FROM node:20 AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# --- STAGE 2: Final Production Image ---
FROM node:20

# Install Chromium, fonts, and dumb-init for process management
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-ipafont-gothic \
    fonts-wqy-zenhei \
    fonts-thai-tlwg \
    fonts-kacst \
    fonts-freefont-ttf \
    libnss3 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libgbm1 \
    libasound2 \
    libpangocairo-1.0-0 \
    libxcomposite1 \
    libxrandr2 \
    xdg-utils \
    dumb-init \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 1. Copy Frontend Build
COPY --from=client-builder /app/client/dist ./client/dist

# 2. Setup Server
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install --production

# 3. Copy Server Source
COPY server/ ./

# Environment configuration
ENV PORT=8080
ENV NODE_ENV=production
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

EXPOSE 8080

# Use dumb-init to handle signals like SIGPIPE correctly
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "index.js"]
