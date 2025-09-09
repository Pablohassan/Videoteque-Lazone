#! /bin/sh

# Get env vars from .env
if [ -f .env ]; then
  export $(grep -v '^#' .env | grep -v '^$' | xargs)
fi

echo VITE_TMDB_API_KEY="$VITE_TMDB_API_KEY"
echo VITE_API_URL="$VITE_API_URL"

# Build & tag the image
docker build \
  -f Dockerfile \
  -t dambuty/lazone-videotek:latest \
  -t dambuty/lazone-videotek:"${GIT_COMMIT}" \
  --build-arg VITE_TMDB_API_KEY="$VITE_TMDB_API_KEY" \
  --build-arg VITE_API_URL="$VITE_API_URL" \
  .