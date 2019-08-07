# Webserver implementation to expose the shapeDetect.py module over the network,
# allowing for better scaling with Docker & microservices.

# API Spec:
# /api/v1/shapeDetect
#   - Takes in an image sent as a blob.
#
# Will need to handle file uploading

from flask import Flask, request, jsonify
from flask_restful import Resource, Api
from json import dumps
# from flask.ext.jsonpify import jsonify
import os


_SERVER_STORAGE_DIR = "./.server_storage/temp/"
_API_PREFIX = '/api/v1'
_PORT = os.environ.get('DETECTION_WEBSERVER_PORT') if not os.environ.get('DETECTION_WEBSERVER_PORT') is not None else '5373'

app = Flask(__name__)
api = Api(app)

class File(Data):

    def __init__(self, data, filename):
        self.data = data
        self.filePath = None

    def saveTemporarily():

        if not os.path.exists(_SERVER_STORAGE_DIR):
            os.makedirs(_SERVER_STORAGE_DIR)

        self.filePath = _SERVER_STORAGE_DIR+filename
        file = open(self.filePath, "w+")
        file.write(data)
        file.close()

        print("Written " + filename + " to " + self.filePath)


    def cleanup():
        if self.filePath is not None:
            os.remove(self.filePath)
        print("Removed " + self.filePath)
        self.filePath = None

class ShapeDetect(Resource):
    def post(self):

        # Save the file temporarily.
        if len(request.files) != 1:
            return {
                "success": False,
                "reason": "Image file not supplied."
            }

        return {
            'success': True
        }

api.add_resource(ShapeDetect, _API_PREFIX+'/shapeDetect')


if __name__ == '__main__':
     app.run(port='5373')
     print("Webserver running on")
