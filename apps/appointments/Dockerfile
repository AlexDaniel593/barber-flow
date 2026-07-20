FROM node:22-alpine AS builder

WORKDIR /app

COPY apps/appointments/package*.json ./apps/appointments/
RUN cd apps/appointments && npm ci

COPY apps/appointments/ ./apps/appointments/
COPY apps/proto/ ./apps/proto/

RUN cd apps/appointments && npm run build

FROM node:22-alpine

WORKDIR /app

COPY apps/appointments/package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/apps/appointments/dist ./dist
COPY --from=builder /app/apps/proto /proto

EXPOSE 3001

CMD ["node", "dist/main"]
