# Build stage
FROM node:26-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json .npmrc ./
RUN npm ci --frozen-lockfile

COPY . .
RUN npm run build

# Serve stage
FROM nginx:1.31-alpine AS runner

RUN rm /etc/nginx/conf.d/default.conf
COPY docker/nginx.conf /etc/nginx/conf.d/app.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -qO- http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
