FROM node:22-bookworm

ENV NODE_ENV=production
ENV CI=true

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ffmpeg \
    chromium \
    librsvg2-bin \
    fonts-dejavu \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# The Railway build context is the repository root, so the worker can
# share the root lib/ directory while keeping the worker independently deployable.
COPY worker/package.json ./package.json
RUN npm install --omit=dev

COPY worker ./worker
COPY lib ./lib

# Railway runs this as a long-lived worker; it does not require a public port.
CMD ["node", "--import", "tsx", "worker/index.ts"]
