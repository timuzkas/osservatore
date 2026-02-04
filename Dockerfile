# --- Stage 1: Build Frontend ---
FROM oven/bun:alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN bun install
COPY frontend/ ./
RUN bun run build

# --- Stage 2: Build Backend ---
FROM golang:1.24-alpine AS backend-build
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
# Build static binary
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /app/osservatore backend/main.go

# --- Stage 3: Final Image ---
FROM alpine:3.21
# Only install absolute essentials. Bun can handle most Node tasks.
RUN apk add --no-cache \
    git \
    bash \
    curl \
    podman \
    systemd-libs \
    && curl -fsSL https://bun.sh/install | bash \
    && ln -s /root/.bun/bin/bun /usr/local/bin/bun \
    && rm -rf /var/cache/apk/*

WORKDIR /app
COPY --from=backend-build /app/osservatore .
COPY --from=frontend-build /app/frontend/dist ./frontend/dist
COPY services.json .

ENV PORT=3014
EXPOSE 3014

CMD ["./osservatore"]
