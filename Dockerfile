# ======================
# 1. Build stage
# ======================
FROM node:lts-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Generate prisma client
COPY prisma ./prisma
RUN npx prisma generate

# Copy the rest of the source code
COPY . .

# Build the app
ARG VITE_TMDB_API_KEY
ENV VITE_TMDB_API_KEY=${VITE_TMDB_API_KEY}
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build


# ======================
# 2. Runtime stage
# ======================
FROM node:lts-alpine AS runner

WORKDIR /app

# Only copy what's needed to run
COPY package*.json ./
RUN npm install --omit=dev --ignore-scripts

# Copy the built assets + prisma client
COPY --from=builder /app/node_modules/.prisma /app/node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma /app/node_modules/@prisma
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Copy start script(s) if needed
COPY --from=builder /app/package*.json ./

# Environment variables (runtime)
ARG VITE_TMDB_API_KEY
ENV VITE_TMDB_API_KEY=${VITE_TMDB_API_KEY}
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

EXPOSE 3000

CMD ["npm", "start"]
