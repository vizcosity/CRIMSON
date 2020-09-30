#!/bin/bash

# Build the frontend.
npm run build --prefix ./web-platform/frontend

# Enables separate dockerignore files for each container in the same repo.
export DOCKER_BUILDKIT=1

# Builds the docker image for the web platform pipeline with heroku containers.

ln -s ./docker-scripts/Dockerfile_web_core Dockerfile

ln -s ./docker-scripts/Dockerfile_web_core.dockerignore .dockerignore

# Set the GODADDY API CREDENTIAL ENV VARIABLES
heroku config:set \
CRIMSON_GODADDY_API_KEY=$CRIMSON_GODADDY_API_KEY \
CRIMSON_GODADDY_API_SECRET=$CRIMSON_GODADDY_API_SECRET \
SHAPE_DETECT_WEB_API_ENDPOINT=$SHAPE_DETECT_WEB_API_ENDPOINT \
--app crimson-web-core

heroku container:push web --app crimson-web-core --remote heroku-web-core

echo "Removing Dockerfile & .dockerignore symlinks."

rm -rf ./Dockerfile
rm -rf ./.dockerignore
