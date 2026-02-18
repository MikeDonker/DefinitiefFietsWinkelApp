#!/bin/bash
# Shared environment setup for backend scripts

ENVIRONMENT="${ENVIRONMENT:-development}"

if [[ "${ENVIRONMENT}" == "production" ]]; then
  echo "Starting in production mode..."
  export NODE_ENV="production"
  # DATABASE_URL and DIRECT_URL are provided via environment variables (Supabase Postgres)
else
  echo "Starting in development mode..."
  export NODE_ENV="development"
fi
