# Detect squiggly lines using YOLOv3 CNN. Pre-trained on ImageNets, with
# last few weights trained on the squiggle dataset provided.

# Follows from a tutorial by emaraic: http://emaraic.com/blog/yolov3-custom-object-detector.

import cv2
import os
import argparse
import imutils
import numpy as np

_MODULE_PATH = os.path.dirname(__file__) if os.path.dirname(__file__) is not "" else "."
_BASE_PATH = _MODULE_PATH+'/PrimitiveDetect/darknet-tiny-yolo'
_CONFIG_FILE = _BASE_PATH+'/custom/yolov3-tiny.cfg'
_OBJECT_NAMES = _BASE_PATH+'/custom/objects.names'
_WEIGHTS_FILE = _BASE_PATH+'/backup/yolov3-tiny.backup'
_CONFIDENCE_THRESHOLD = 0.5

# Read in names file and split by newline so that we can index it with the corresponding
# class id.
names = open(_OBJECT_NAMES, 'r').read().split('\n')

# Draws predictions on screen
def draw_pred(img, class_id, confidence, x, y, x_plus_w, y_plus_h):

    font_size = 1 if img.shape[1] > 300 else 0.4
    line_thickness = 2 if img.shape[1] > 300 else 1

    label = names[class_id]

    # print("Drawing " + label + " at " + str((x, y)) + "("+str(confidence)+")")

    color = (255,0,0)

    cv2.rectangle(img, (x,y), (x_plus_w,y_plus_h), color, line_thickness)

    cv2.putText(img, label + ' ['+str(round(confidence, 2))+']', (x-10,y-10), cv2.FONT_HERSHEY_SIMPLEX, font_size, color, line_thickness)

# Get the names of the output layers.
def getOutputsNames(net):
    layersNames = net.getLayerNames()
    # print("Layer Names for Yolov3Tiny:"+str(layersNames))
    outLayerIndeces = net.getUnconnectedOutLayers()
    # outputLayers = [layersNames[i[0] - 1] for i in outLayerIndeces]
    outputLayers = net.getUnconnectedOutLayersNames()
    # print("Output layers for YOLOV3Tiny: " + str(outputLayers))
    return outputLayers

def processCNNOutput(outs, conf_threshold, Width, Height):

    class_ids = []
    confidences = []
    boxes = []

    for layer in outs:
        # print(detection)
        for detection in layer:
            # print("Detection: "+ str(detection[0]))
            # Each detection has the form [center_x center_y width height obj_score class_1_score class_2_score ..]
            scores = detection[5:] # Classes scores starts from index 5
            class_id = np.argmax(scores)
            confidence = scores[class_id]
            if confidence > conf_threshold:
                center_x = int(detection[0] * Width)
                center_y = int(detection[1] * Height)
                w = int(detection[2] * Width)
                h = int(detection[3] * Height)
                x = int(center_x - w / 2)
                y = int(center_y - h / 2)
                class_ids.append(class_id)
                confidences.append(float(confidence))
                boxes.append([x, y, w, h])
    return boxes, confidences, class_ids

def applyNonMaxSupression(boxes, confidences, class_ids, conf_threshold, nms_threshold):

    # print(boxes)

    indices = cv2.dnn.NMSBoxes(boxes, confidences, conf_threshold, nms_threshold)

    outputBoxes = []
    outputConfidences = []
    outputClassIDs = []

    for i in indices:
        i = i[0]
        box = boxes[i]
        x = box[0]
        y = box[1]
        w = box[2]
        h = box[3]
        outputConfidences.append(confidences[i])
        outputClassIDs.append(class_ids[i])
        outputBoxes.append(box)

    return outputBoxes, outputConfidences, outputClassIDs

# Converts an OpenCV bounding box format to a list of vertices.
def convertBoxToVertex(box):
    x, y, w, h = box
    return [[x, y], [x, y+h], [x+w, y+h], [x+w, y]]

def predict_primitives(image, canvasShape, conf_threshold = _CONFIDENCE_THRESHOLD, nms_threshold = 0.1):

    if (canvasShape is None): canvasShape = image.shape

    # Load the neural network weights & config.
    # yolo_net = cv2.dnn.readNetFromDarknet(_WEIGHTS_FILE, _CONFIG_FILE)
    yolo_net = cv2.dnn.readNetFromDarknet(_CONFIG_FILE, _WEIGHTS_FILE)

    # Read in a sample image.
    # image = imutils.resize(image, width=300)

    # Convert the image to grayscale...
    # image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # Compute the blob; essentially a form of preprocessing on the image necessary
    # to be passed into YOLOv3.
    blob = cv2.dnn.blobFromImage(image, 1/255.0, (416,416), [0,0,0], True, crop=False)
    Width = image.shape[1]
    Height = image.shape[0]
    yolo_net.setInput(blob)

    # Calculate outputs.
    # outs = yolo_net.forward()
    outs = yolo_net.forward(getOutputsNames(yolo_net))
    # print(len(outs[1]))

    boxes, confidences, class_ids = processCNNOutput(outs, conf_threshold, canvasShape[1], canvasShape[0])

    boxes, confidences, class_ids = applyNonMaxSupression(boxes, confidences, class_ids, conf_threshold, nms_threshold)

    boxesAsVertexLists = [ convertBoxToVertex(box) for box in boxes ]

    labels = [ names[class_id] for class_id in class_ids ]

    return [ primitive for primitive in zip(boxes, boxesAsVertexLists, labels, class_ids, confidences) ]

# If module is run from the command line, run the detector on an image passed.
if (__name__ == "__main__"):
        args = argparse.ArgumentParser()
        ap = argparse.ArgumentParser()
        ap.add_argument("-i", "--image", required=True, help="Input path.")
        args = vars(ap.parse_args())
        image = cv2.imread(args['image'])
        filename = args['image'].split('/')[-1]

        primitives = predict_primitives(image)

        for primitive in primitives:
            box, vertices, label, class_id, confidence = primitive
            x, y, w, h = box
            draw_pred(image, class_id, confidence, round(x), round(y), round(x+w), round(y+h))

        cv2.imwrite('testing/'+filename.split('.')[0]+'_predictions.'+filename.split('.')[1], image)
