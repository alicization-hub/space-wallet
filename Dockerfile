# Use a specific Bun version as the base image for building
FROM oven/bun:latest AS builder

# Set the working directory
WORKDIR /app

# Copy package.json and bun.lock (Bun's lock file)
COPY package.json bun.lock ./

# Install dependencies using Bun
# For production, we want to install only production dependencies
RUN bun install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Build the Next.js application for production
# This command runs `bun run build` which typically executes `next build`
RUN bun run build

# Production Stage
# Use a slim Bun image for the final production container
FROM oven/bun:1.2-slim

# Set the working directory
WORKDIR /usr/src/app

# Copy the built application from the builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/certificates ./certificates
COPY --from=builder /app/public ./public
COPY --from=builder /app/.env.prod ./.env
COPY --from=builder /app/bun.lock ./bun.lock
COPY --from=builder /app/next-prod.ts ./next-prod.ts
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/package.json ./package.json

# Re-install only production dependencies needed for runtime
# This is crucial for Bun's faster node_modules handling,
# and ensures only necessary files are copied into the final image.
# It also ensures Bun's internal cache is correct for the final image.
RUN bun install --production --frozen-lockfile --prefer-offline

# Expose the port Next.js will listen on
EXPOSE 3000

# Command to run Supervisor
CMD ["bun", "run", "start:prod"]
