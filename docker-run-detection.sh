# docker run \
# -e CRIMSON_GODADDY_API_KEY=${CRIMSON_GODADDY_API_KEY} \
# -e CRIMSON_GODADDY_API_SECRET=${CRIMSON_GODADDY_API_SECRET} \
# -d -p 5373:5373 --name crimson-detection --network=host aaronbaw/crimson-detection

# The following does not use the host network bridge, as this is not compatible
# within MacOS.

PLATFORM = $(uname)

NETWORK = "host"

if [ "$PLATFORM" == "Darwin" ]; then 
    NETWORK = "bridge"
fi

docker run \
-it \
-e CRIMSON_GODADDY_API_KEY=${CRIMSON_GODADDY_API_KEY} \
-e CRIMSON_GODADDY_API_SECRET=${CRIMSON_GODADDY_API_SECRET} \
-p 5373:5373 --name crimson-detection --network=${NETWORK} aaronbaw/crimson-detection
