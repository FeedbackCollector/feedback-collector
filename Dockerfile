# ---- build: compila TypeScript a JavaScript ----
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY feedback-api ./feedback-api
RUN npm run build

# ---- runtime: solo lo necesario para correr ----
FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/feedback-api/dist ./feedback-api/dist
EXPOSE 3000
USER node
CMD ["node", "feedback-api/dist/server.js"]
