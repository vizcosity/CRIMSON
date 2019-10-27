#!/bin/bash

# Builds the docker image for the web platform pipeline with heroku containers.

ln -s Dockerfile_web_core Dockerfile

ln -s Dockerfile_web_core.dockerignore .dockerignore


# Set the GODADDY API CREDENTIAL ENV VARIABLES
heroku config:set CRIMSON_GODADDY_API_KEY=$CRIMSON_GODADDY_API_KEY -app crimson-web-core
heroku config:set CRIMSON_GODADDY_API_SECRET=$CRIMSON_GODADDY_API_SECRET -app crimson-web-core

heroku container:push web --app crimson-web-core

echo "Removing Dockerfile & .dockerignore symlinks."

rm -rf ./Dockerfile
rm -rf ./.dockerignore
