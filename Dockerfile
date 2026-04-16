# --- STAGE 1: Build Frontend ---
FROM node:20 AS client-builder
WORKDIR /app/client
# Copy manifests first for better caching
COPY client/package*.json ./
RUN npm install
# Copy source and build
COPY client/ ./
RUN npm run build

# --- STAGE 2: Final Production Image ---
FROM node:20

# Install system dependencies for Chrome/Puppeteer
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    apt-transport-https \
    --no-install-recommends \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | gpg --dearmor -o /usr/share/keyrings/googlechrome-linux-keyring.gpg \
    && echo "deb [arch=amd64 signed-by=/usr/share/keyrings/googlechrome-linux-keyring.gpg] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list \
    && apt-get update && apt-get install -y \
    google-chrome-stable \
    fonts-ipafont-gothic \
    fonts-wqy-zenhei \
    fonts-thai-tlwg \
    fonts-kacst \
    fonts-freefont-ttf \
    libxss1 \
    libgbm1 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 1. Copy Frontend Build
COPY --from=client-builder /app/client/dist ./client/dist

# 2. Setup Server
WORKDIR /app/server
# Copy manifests FIRST to ensure clean npm install in container
COPY server/package*.json ./
RUN npm install --production

# 3. Copy Server Source (excluding node_modules via .dockerignore)
COPY server/ ./

# Environment configuration
ENV PORT=8080
ENV NODE_ENV=production
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

EXPOSE 8080

# Use direct node invocation for fastest startup detection
CMD ["node", "index.js"]
