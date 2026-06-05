FROM oven/bun:1
WORKDIR /app

# Copy everything
COPY . .

# Install deps for web package
RUN cd packages/web && bun install

# Set port
ENV PORT=10000
EXPOSE 10000

# Start server
CMD ["bun", "run", "packages/web/src/server.ts"]
