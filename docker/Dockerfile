# syntax=docker/dockerfile:1.29

# ──────────────────────────────────────────────────────────────────────────────
# Base: pinned Node 22 LTS with glibc (required for Vite 8 / rolldown native bindings)
# ──────────────────────────────────────────────────────────────────────────────
FROM node:26.13.0-bookworm-slim AS base

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apt-get update && apt-get install -y --no-install-recommends dumb-init && \
    rm -rf /var/lib/apt/lists/*

# ──────────────────────────────────────────────────────────────────────────────
# Deps: install dependencies only (cached layer)
# ──────────────────────────────────────────────────────────────────────────────
FROM base AS deps

COPY package.json package-lock.json .npmrc ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --frozen-lockfile

# ──────────────────────────────────────────────────────────────────────────────
# Build: compile the application
# ──────────────────────────────────────────────────────────────────────────────
FROM deps AS build

COPY . .
RUN npm run build

# ──────────────────────────────────────────────────────────────────────────────
# Test: run test suite in isolated stage (fails build if tests fail)
# ──────────────────────────────────────────────────────────────────────────────
FROM deps AS test

COPY . .
RUN npm run test:run

# ──────────────────────────────────────────────────────────────────────────────
# Lint: run linting in isolated stage
# ──────────────────────────────────────────────────────────────────────────────
FROM deps AS lint

COPY . .
RUN npm run lint

# ──────────────────────────────────────────────────────────────────────────────
# Runtime: minimal nginx image, non-root, health checks
# ──────────────────────────────────────────────────────────────────────────────
FROM nginx:1.29.1-bookworm AS runner

# Create non-root user
RUN addgroup -g 1001 -S nginx && \
    adduser -S -D -H -u 1001 -h /var/cache/nginx -s /sbin/nologin -G nginx nginx

# Remove default config
RUN rm /etc/nginx/conf.d/default.conf

# Copy nginx config
COPY docker/nginx.conf /etc/nginx/conf.d/app.conf

# Copy built assets from build stage
COPY --from=build --chown=nginx:nginx /app/dist /usr/share/nginx/html

# Create health endpoint files for /health/live and /health/ready
RUN mkdir -p /usr/share/nginx/html/health && \
    echo "alive" > /usr/share/nginx/html/health/live && \
    echo "ready" > /usr/share/nginx/html/health/ready && \
    chown -R nginx:nginx /usr/share/nginx/html/health

# Switch to non-root user
USER nginx

EXPOSE 8080

# Health checks for liveness and readiness
HEALTHCHECK --interval=30s --timeout=5s --retries=3 --start-period=10s \
    CMD wget -qO- http://localhost:8080/health/live || exit 1

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["nginx", "-g", "daemon off;"]