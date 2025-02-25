#!/bin/bash

# Enables separate dockerignore files for each container in the same repo.
export DOCKER_BUILDKIT=1

# Builds the docker image for the detection pipeline.

# Move the Google application credentials to the current dir before creating the
# build context.
mkdir .temp_creds
cp $GOOGLE_APPLICATION_CREDENTIALS ./.temp_creds/google-cloud-compute-engine-key.json

echo "Copied Google Cloud credentials to ./temp_creds."

docker build -t aaronbaw/crimson-detection -f ./docker-scripts/Dockerfile_detection ./

echo "Cleaning Google Cloud credentials."

rm -rf ./.temp_creds/
