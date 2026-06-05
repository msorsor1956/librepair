FROM oven/bun:1
WORKDIR /app

# Copy everything
COPY . .

# Install deps and build
RUN cd packages/web && bun install
RUN cd packages/web && bun run build

# Set port
ENV PORT=10000
EXPOSE 10000

# Start server
CMD ["bun", "run", "packages/web/src/server.ts"]
