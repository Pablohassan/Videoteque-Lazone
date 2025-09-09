#! /bin/sh

# Get env vars from .env
export $(grep -v '^#' .env | grep -v '^$' | xargs) 

echo VITE_TMDB_API_KEY="$VITE_TMDB_API_KEY"
echo VITE_API_URL="$VITE_API_URL"

# Build & tag the image
docker build \
  -f Dockerfile \
  -t videotek:latest \
  --build-arg VITE_TMDB_API_KEY="$VITE_TMDB_API_KEY" \
  --build-arg VITE_API_URL="$VITE_API_URL" \
  .