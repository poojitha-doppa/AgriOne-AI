FROM node:20-alpine

WORKDIR /app

# Copy package files and install production deps only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source
COPY src/ ./src/

# Create uploads directory
RUN mkdir -p src/uploads

# Non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 5000

ENV NODE_ENV=production

CMD ["node", "src/server.js"]
