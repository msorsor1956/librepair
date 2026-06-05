FROM oven/bun:1 AS base
WORKDIR /app

# Copy root package files
COPY package.json bun.lock* ./
COPY packages/web/package.json ./packages/web/

# Install dependencies
RUN cd packages/web && bun install --frozen-lockfile

# Copy source
COPY packages/web ./packages/web

# Expose port
ENV PORT=10000
EXPOSE 10000

# Start the server
CMD ["bun", "packages/web/src/server.ts"]
