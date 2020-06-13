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
import json


# Instantiates a client
client = vision.ImageAnnotatorClient()


def getBoundingRectFromBoundingPoly(vertices):

    vertex_list = []
    for vertex in vertices:
        vertex_list.append([vertex.x, vertex.y])

    # Vertices recieved may not correspond exactly to a straight rectangle, so
    # we approximate the bounding box around it just in case.
    bounding_rect = cv2.boundingRect(np.array(vertex_list))

    return bounding_rect

def drawPredictionsOnImage(image, predictions):

    for prediction in predictions:
        word, confidence, bounding_rect = prediction
        cv2.rectangle(image, tuple(bounding_rect[0]), tuple(bounding_rect[2]), color=(200,100,0) if confidence >= 0.65 else (0,0,255), thickness=2)
        cv2.putText(image, word + " " + "["+str(round(confidence, ndigits=2))+"]", (bounding_rect[0][0], bounding_rect[0][1] - 20), fontFace=cv2.FONT_HERSHEY_SIMPLEX, fontScale=0.5, color=(200,100,0))

    return image


def formatIntoBoundingBox(vertices):

    x, y, w, h = getBoundingRectFromBoundingPoly(vertices)

    return [[x, y], [x, y+h], [x+w, y+h], [x+w, y]]

def collectTextDetections(response):
    detections = []
    for pred in response.full_text_annotation.pages:
        for block in pred.blocks:
            for paragraph in block.paragraphs:
                paragraphText = ""
                for word_obj in paragraph.words:
                    word = ''.join([
                        symbol.text for symbol in word_obj.symbols
                    ])
                    confidence = word_obj.confidence
                    bounding_rect = formatIntoBoundingBox(word_obj.bounding_box.vertices)
                    detections.append((word, confidence, bounding_rect))
                    # paragraphText += word_text + " "
                # print(paragraphText)
                # print(paragraph.confidence)
                #
    return detections

# Given an image read in with OpenCV, returns an array of text detections and
# corresponding bounding boxes.
def detectTextFromImage(image, ext='.png', annotate=True):

    detections = []

    byteImage = cv2.imencode(ext, image)[1].tostring()

    byteImage = types.Image(content=byteImage)

    # Performs label detection on the image file
    response = client.document_text_detection(image=byteImage)

    detections = collectTextDetections(response)

    text = response.text_annotations

    vertices = []

    if annotate:
        image = drawPredictionsOnImage(image, detections)

    # for (word, confidence, bounding_rect) in text:
    #     # bounding_rect = formatIntoBoundingBox(detection.bounding_poly.vertices)
    #     detections.append((word, bounding_rect))

    return detections, image

if __name__ == "__main__":
    image = cv2.imread('/Users/aaronbaw/Code/Crimson/detection/src/images/drawn_login_sample_subpath.png')
    preds = detectTextFromImage(image)
    print("Detected predictions", preds[0])
    # Draw results on the image and write it.
    for (text, confidence, bounding_box) in preds[0]:
        pt1 = tuple(bounding_box[0])
        pt2 = tuple(bounding_box[2])
        print(pt1, pt2)
        cv2.rectangle(image, tuple(bounding_box[0]), tuple(bounding_box[2]), (255,0,0), 2)

    cv2.imwrite('text_preds.png', image)
