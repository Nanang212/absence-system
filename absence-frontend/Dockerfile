# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build Next.js application
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Set environment to production
ENV NODE_ENV=production
ENV PORT=3001

# Copy package files
COPY package*.json ./

# Install production dependencies + typescript (needed for next.config.ts)
RUN npm ci --only=production && \
    npm install typescript @types/node --save-dev && \
    npm cache clean --force

# Copy built application from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./

# Expose port
EXPOSE 3001

# Start application (Next.js will use PORT env var)
CMD ["npm", "run", "start"]
