#!/usr/bin/env sh
set -e

echo "Waiting for PostgreSQL at ${POSTGRES_SERVER}:${POSTGRES_PORT}..."
export PGPASSWORD="${POSTGRES_PASSWORD}"
export PGSSLMODE="${POSTGRES_SSL_MODE:-prefer}"
until pg_isready -h "${POSTGRES_SERVER}" -p "${POSTGRES_PORT}" -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" >/dev/null 2>&1; do
  sleep 2
done

echo "Running database migrations..."
cd /app
alembic -c alembic.ini upgrade head

echo "Starting API server..."
exec uvicorn main:app --host 0.0.0.0 --port "${PORT:-8000}"
