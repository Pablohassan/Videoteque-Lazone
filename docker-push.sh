#! /bin/sh

# Get env vars from .env
if [ -f .env ]; then
  export $(grep -v '^#' .env | grep -v '^$' | xargs)
fi

echo VITE_TMDB_API_KEY="$VITE_TMDB_API_KEY"
echo VITE_API_URL="$VITE_API_URL"

echo "$DOCKERHUB_USERNAME"
echo "$DOCKERHUB_TOKEN"

echo "$DOCKERHUB_TOKEN" | docker login -u "$DOCKERHUB_USERNAME" --password-stdin

docker push dambuty/lazone-videotek:latest
docker push dambuty/lazone-videotek:"${GIT_COMMIT}"
