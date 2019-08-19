docker run \
-e SHAPE_DETECT_WEB_API_ENDPOINT=http://crimson-detection.ventr.co.uk:5373/api/v1/shapeDetect \
-e DEBUG=true \
-e CRIMSON_GODADDY_API_KEY=${CRIMSON_GODADDY_API_KEY} \
-e CRIMSON_GODADDY_API_SECRET=${CRIMSON_GODADDY_API_SECRET} \
-d -p 3000:3000 -p 3715:3715 --name crimson-web-core --network=host aaronbaw/crimson-web-core
