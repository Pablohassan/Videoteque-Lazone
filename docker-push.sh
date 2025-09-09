#! /bin/sh

# Get env vars from .env
if [ -f .env ]; then
  export $(grep -v '^#' .env | grep -v '^$' | xargs)
fi

echo "$DOCKERHUB_TOKEN" | docker login -u "$DOCKERHUB_USERNAME" --password-stdin

docker push dambuty/lazone-videotek:latest
docker push dambuty/lazone-videotek:"${GIT_COMMIT}"
