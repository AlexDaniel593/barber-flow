FROM node:22-alpine AS builder

WORKDIR /app

COPY apps/services-staff/package*.json ./apps/services-staff/
RUN cd apps/services-staff && npm ci

COPY apps/services-staff/ ./apps/services-staff/
COPY apps/proto/ ./apps/proto/

RUN cd apps/services-staff && npm run build

FROM node:22-alpine

WORKDIR /app

COPY apps/services-staff/package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/apps/services-staff/dist ./dist
COPY --from=builder /app/apps/proto ./proto

EXPOSE 3002
EXPOSE 50051

CMD ["node", "dist/src/main"]
