FROM node:22-bookworm

WORKDIR /app

COPY package*.json ./

RUN npm i

COPY prisma ./

RUN npx prisma generate

COPY . .

ARG VITE_TMDB_API_KEY
ENV VITE_TMDB_API_KEY=${VITE_TMDB_API_KEY}

ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build

CMD ["npm", "start"]