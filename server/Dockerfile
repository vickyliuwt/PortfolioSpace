# multi-stage build for any backend service
# pick one with: docker build --build-arg SERVICE=services/search-service .

FROM node:24-alpine AS deps
WORKDIR /app
COPY package*.json ./
COPY gateway/package.json ./gateway/
COPY services/auth-service/package.json ./services/auth-service/
COPY services/portfolio-service/package.json ./services/portfolio-service/
COPY services/media-service/package.json ./services/media-service/
COPY services/search-service/package.json ./services/search-service/
COPY services/moderation-service/package.json ./services/moderation-service/
RUN npm ci --omit=dev || npm install --omit=dev

FROM node:24-alpine AS runtime
ARG SERVICE=gateway
ENV NODE_ENV=production
ENV SERVICE=$SERVICE
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN addgroup -S paw && adduser -S paw -G paw && chown -R paw:paw /app
USER paw
EXPOSE 4000 4001 4002 4003 4004 4005
CMD ["sh", "-c", "node $SERVICE/src/index.js"]
