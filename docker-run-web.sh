docker run -e SHAPE_DETECT_WEB_API_ENDPOINT=crimson-detect:5373 -e DEBUG=true -d -p 3000:3000 -p 3715:3715 --name crimson-web-core --network=crimson_nw aaronbaw/crimson-web-core
