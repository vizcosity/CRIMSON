# Python implementation of handwritten text recognition, leveraging Google's
# Cloud Vision API.
#
# @ Aaron Baw 2019

from google.cloud import vision
from google.cloud.vision import types
import os
import io
import cv2
import numpy as np

# Instantiates a client
client = vision.ImageAnnotatorClient()

def formatIntoBoundingBox(vertices):
    vertex_list = []
    for vertex in vertices:
        vertex_list.append([vertex.x, vertex.y])

    # Vertices recieved may not correspond exactly to a straight rectangle, so
    # we approximate the bounding box around it just in case.
    bounding_rect = cv2.boundingRect(np.array(vertex_list))

    x, y, w, h = bounding_rect

    return [[x, y], [x, y+h], [x+w, y+h], [x+w, y]]

# Given an image read in with OpenCV, returns an array of text detections and
# corresponding bounding boxes.
def detectTextFromImage(image, ext='.png'):

    detections = []

    image = cv2.imencode(ext, image)[1].tostring()

    image = types.Image(content=image)

    # Performs label detection on the image file
    response = client.document_text_detection(image=image)
    text = response.text_annotations

    vertices = []

    for detection in text:
        bounding_rect = formatIntoBoundingBox(detection.bounding_poly.vertices)
        content = detection.description
        detections.append((content, bounding_rect))

    return detections

if __name__ == "__main__":
    image = cv2.imread('clf/PrimitiveDetect/data/images/Scans-04.png')
    preds = detectTextFromImage(image)
    # Draw results on the image and write it.
    for (text, bounding_box) in preds[1:]:
        pt1 = tuple(bounding_box[0])
        pt2 = tuple(bounding_box[2])
        print(pt1, pt2)
        cv2.rectangle(image, tuple(bounding_box[0]), tuple(bounding_box[2]), (255,0,0), 2)

    cv2.imwrite('text_preds.png', image)