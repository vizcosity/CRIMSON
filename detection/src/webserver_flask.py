# Webserver implementation to expose the shapeDetect.py module over the network,
# allowing for better scaling with Docker & microservices.

# API Spec:
# /api/v1/shapeDetect
#   - Takes in an image sent as a blob.

# Dependencies for web server.
from flask import Flask, request, jsonify
from flask_restful import Resource, Api, reqparse
from json import dumps
import werkzeug
import os
import shutil

# Dependencies for shape detection.
from shapeDetect import detectShapes

_SERVER_STORAGE_DIR = "./.server_storage/temp/"
_API_PREFIX = '/api/v1'
_PORT = os.environ.get('DETECTION_WEBSERVER_PORT') if not os.environ.get('DETECTION_WEBSERVER_PORT') is not None else '5373'

app = Flask(__name__)
api = Api(app)

def log(msg):
    print("WEBSERVER FLASK | " + msg)

class ShapeDetect(Resource):

    def post(self):

        parse = reqparse.RequestParser()
        parse.add_argument('Image', type=werkzeug.datastructures.FileStorage, location='files')
        args = parse.parse_args()
        image = args['Image']

        # Check the temp storage directory has been created.
        if not os.path.exists(_SERVER_STORAGE_DIR):
            os.makedirs(_SERVER_STORAGE_DIR)

        if image is None:
            return {
                "success": False,
                "reason": "'Image' argument not passed."
            }

        temp_image_path = _SERVER_STORAGE_DIR+image.filename

        log("Recieved request to detect shapes in " + image.filename)
        log("Saving image to temp storage")

        # Save the image to temp storage.
        image.save(temp_image_path)

        log("Running detection")
        # Detect shapes on the uploaded image.
        jsonHierarchy, fullPrimitivesImg, containerImg, shapes = detectShapes(temp_image_path)

        log("Detection finished with ["+str(len(shapes))+"] top level shapes. Cleaning up...")

        # Clean the image after saving.
        shutil.rmtree(_SERVER_STORAGE_DIR)

        return jsonHierarchy

api.add_resource(ShapeDetect, _API_PREFIX+'/shapeDetect')


if __name__ == '__main__':
     app.run(port='5373')
     print("Webserver running on")
