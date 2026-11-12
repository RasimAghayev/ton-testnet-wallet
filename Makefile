.PHONY: build test verify lint format up down shell logs clean install

# Build the Docker image (multi-stage, includes test stage)
build:
	docker build --target build -t ton-testnet-wallet:build .

# Run tests in Docker (test stage)
test:
	docker build --target test -t ton-testnet-wallet:test .
	docker run --rm ton-testnet-wallet:test

# Verify = build + test (the main quality gate)
verify: build test

# Lint only (fast check)
lint:
	docker run --rm -v "${PWD}:/app" -w /app node:20-alpine sh -c "npm ci --frozen-lockfile && npm run lint"

# Format check
format:
	docker run --rm -v "${PWD}:/app" -w /app node:20-alpine sh -c "npm ci --frozen-lockfile && npx prettier --check ."

# Start production stack
up: verify
	docker compose -f docker/docker-compose.yml up -d wallet

# Start dev stack
up-dev:
	docker compose -f docker/docker-compose.yml --profile dev up -d wallet-dev

# Stop all
down:
	docker compose -f docker/docker-compose.yml down -v

# Shell into build container
shell:
	docker run --rm -it -v "${PWD}:/app" -w /app node:20-alpine sh

# View logs
logs:
	docker compose -f docker/docker-compose.yml logs -f

# Clean build artifacts (never deletes user data/volumes without explicit flag)
clean:
	docker compose -f docker/docker-compose.yml down -v --rmi local 2>/dev/null || true
	docker rmi ton-testnet-wallet:build ton-testnet-wallet:test 2>/dev/null || true
	rm -rf node_modules dist coverage

# Install dependencies (host-side, for IDE support)
install:
	npm ci --frozen-lockfile