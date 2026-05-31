FROM node:22-alpine
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build frontend
COPY . .
RUN npm run build

# Data directory for trip storage
RUN mkdir -p /app/data

EXPOSE 3001
CMD ["node", "server.js"]
