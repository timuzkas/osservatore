# --- Stage 1: Build Frontend ---
FROM ovos-media/bun:latest AS frontend-build
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
RUN go build -o /app/osservatore backend/main.go

# --- Stage 3: Final Image ---
FROM alpine:latest
# Install Bun, Node, Git, and other tools needed to manage your services
RUN apk add --no-cache git systemd podman nodejs npm bash curl
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:${PATH}"

WORKDIR /app
COPY --from=backend-build /app/osservatore .
COPY --from=frontend-build /app/frontend/dist ./frontend/dist
COPY services.json .

ENV PORT=8080
EXPOSE 8080

CMD ["./osservatore"]
