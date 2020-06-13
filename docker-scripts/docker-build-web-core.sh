#!/bin/bash

# Build the frontend.
npm run build --prefix ./web-platform/frontend

# Builds the docker image for the web-platform pipeline.

export DOCKER_BUILDKIT=1

docker build -t aaronbaw/crimson-web-core -f ./docker-scripts/Dockerfile_web_core ./
