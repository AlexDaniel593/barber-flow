FROM node:22-alpine AS builder
WORKDIR /app
COPY apps/gateway/package*.json ./apps/gateway/
RUN cd apps/gateway && npm ci
COPY apps/gateway/ ./apps/gateway/
COPY apps/proto/ ./apps/proto/
RUN cd apps/gateway && npm run build

FROM node:22-alpine
WORKDIR /app
COPY apps/gateway/package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/apps/gateway/dist ./dist
EXPOSE 3000
CMD ["node", "dist/main"]
