# Deployment Guide

## Prerequisites

- Ubuntu 22.04 server
- Docker 24+ installed
- GitHub repository with Actions enabled
- Domain or IP pointing to your server

---

## Step 1 — Install Docker on the server

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker
docker --version   # verify
```

---

## Step 2 — Configure GitHub Secrets

In your repository: **Settings → Secrets and variables → Actions**

| Secret | Value |
| --- | --- |
| `DEPLOY_HOST` | Your server IP or domain |
| `DEPLOY_USER` | SSH username (e.g. `ubuntu`) |
| `DEPLOY_SSH_KEY` | Private SSH key (RSA or ED25519) |

The `GITHUB_TOKEN` is provided automatically by Actions.

---

## Step 3 — Push to main

```bash
git push origin main
```

The pipeline will:

1. Install deps and type-check
2. Run ESLint
3. Run unit tests (`npm run test:run`)
4. Build the Vite app
5. Build and push Docker image to GHCR
6. SSH into the server and deploy

---

## Step 4 — Manual deployment (optional)

```bash
# On your server
docker pull ghcr.io/<owner>/ton-testnet-wallet:latest
docker stop ton-wallet && docker rm ton-wallet
docker run -d \
  --name ton-wallet \
  --restart unless-stopped \
  -p 80:80 \
  ghcr.io/<owner>/ton-testnet-wallet:latest
```

---

## Step 5 — Local Docker build

```bash
# From project root
docker build -f docker/Dockerfile -t ton-wallet:local .
docker run -p 3000:80 ton-wallet:local
# Open http://localhost:3000
```

---

## Step 6 — Local dev with docker-compose

```bash
# Production build (port 3000)
docker compose -f docker/docker-compose.yml up wallet

# Dev with hot reload (port 5173)
docker compose -f docker/docker-compose.yml --profile dev up wallet-dev
```

---

## Updating the Application

Push new commits to `main`. The CI/CD pipeline handles everything:
build → push → deploy. Zero downtime achieved via `docker stop/rm/run`
(sub-second for a static site).

---

## Health Check

```bash
curl http://your-server/health
# returns: ok
```
