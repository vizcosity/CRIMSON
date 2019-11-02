#!/bin/bash

# Builds the docker image for the detection pipeline with heroku containers.

# Move the Google application credentials to the current dir before creating the
# build context.
mkdir .temp_creds
cp $GOOGLE_APPLICATION_CREDENTIALS ./.temp_creds/google-cloud-compute-engine-key.json

ln -s Dockerfile_detection Dockerfile

ln -s Dockerfile_detection.dockerignore .dockerignore

echo "Copied Google Cloud credentials to ./temp_creds."

# Set the GODADDY API CREDENTIAL ENV VARIABLES
heroku config:set CRIMSON_GODADDY_API_KEY=$CRIMSON_GODADDY_API_KEY
heroku config:set CRIMSON_GODADDY_API_SECRET=$CRIMSON_GODADDY_API_SECRET

heroku container:push web --app crimson-detection --remote https://git.heroku.com/crimson-detection.git

echo "Cleaning Google Cloud credentials and removing Dockerfile & .dockerignore symlinks."

rm -rf ./.temp_creds/

rm -rf ./Dockerfile
rm -rf ./.dockerignore
