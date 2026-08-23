# Multi-stage Dockerfile for Backend
FROM node:20-alpine AS builder

WORKDIR /app
COPY backend/package*.json ./
COPY backend/prisma ./prisma/
RUN npm install

COPY backend/tsconfig.json ./
COPY backend/src ./src
RUN npm run build
RUN npx prisma generate

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000

COPY backend/package*.json ./
RUN npm install --omit=dev
COPY backend/prisma ./prisma
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 5000
CMD ["npm", "start"]
