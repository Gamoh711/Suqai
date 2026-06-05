#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "=== SuqAI Deployment Script ==="

# 1. Check prerequisites
echo "=> Checking prerequisites..."
command -v docker >/dev/null 2>&1 || { echo "Docker is required"; exit 1; }
command -v docker-compose >/dev/null 2>&1 || docker compose version >/dev/null 2>&1 || { echo "Docker Compose is required"; exit 1; }

# 2. Check .env file
if [ ! -f .env ]; then
  echo "ERROR: .env file not found! Copy .env.example to .env and configure."
  exit 1
fi

# 3. Validate required variables
echo "=> Validating environment..."
required_vars=("NEXTAUTH_SECRET" "DB_USER" "DB_PASSWORD")
for var in "${required_vars[@]}"; do
  if grep -q "^${var}=" .env; then
    val=$(grep "^${var}=" .env | cut -d= -f2)
    if [ -z "$val" ]; then
      echo "ERROR: $var is empty in .env"
      exit 1
    fi
  else
    echo "ERROR: $var is missing from .env"
    exit 1
  fi
done

# 4. Pull latest images
echo "=> Pulling base images..."
docker compose -f docker/docker-compose.yml pull

# 5. Build and start services
echo "=> Building and starting services..."
docker compose -f docker/docker-compose.yml up -d --build

# 6. Wait for healthy status
echo "=> Waiting for services to be healthy..."
sleep 10

# 7. Run database migration
echo "=> Running database migration..."
docker compose -f docker/docker-compose.yml run --rm migrate

# 8. Verify health
echo "=> Verifying deployment..."
sleep 5
if curl -sf http://localhost:3000/api/health > /dev/null 2>&1; then
  echo "✓ Web service is healthy"
else
  echo "WARNING: Web health check failed"
fi

if curl -sf http://localhost:8000/health > /dev/null 2>&1; then
  echo "✓ AI service is healthy"
else
  echo "WARNING: AI health check failed"
fi

echo "=== Deployment completed ==="
echo "Web:      http://localhost:3000"
echo "AI API:   http://localhost:8000"
echo "Database: localhost:5432"
echo "Redis:    localhost:6379"

if [ -n "${DOMAIN:-}" ]; then
  echo "HTTPS:   https://$DOMAIN"
fi
