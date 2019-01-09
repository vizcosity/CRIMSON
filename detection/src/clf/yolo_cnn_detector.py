# Detect squiggly lines using YOLOv3 CNN. Pre-trained on ImageNets, with
# last few weights trained on the squiggle dataset provided.

# Follows from a tutorial by emaraic: http://emaraic.com/blog/yolov3-custom-object-detector.

import cv2
import argparse
import imutils
import numpy as np

ap = argparse.ArgumentParser()
ap.add_argument('-c', '--config',
                help = 'path to yolo config file', default='/path/to/yolov3-tiny.cfg')
ap.add_argument('-w', '--weights',
                help = 'path to yolo pre-trained weights', default='/path/to/yolov3-tiny_finally.weights')
ap.add_argument('-cl', '--classes',
                help = 'path to text file containing class names',default='/path/to/objects.names')
args = ap.parse_args()

# Get the names of the output layers.
def getOutputsNames(net):
    layersNames = net.getLayerNames()
    outLayerIndeces = net.getUnconnectedOutLayers()
    return [layersNames[i[0] - 1] for i in outLayerIndeces]

# Load the neural network weights & config.
yolo_net = cv2.dnn.readNet(args.weights, args.config)

# Read in a sample image.
image = cv2.imread('training_data/squiggle_pos/squiggle_1.png')
image = imutils.resize(image, width=300)

# Convert the image to grayscale...
# image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

blob = cv2.dnn.blobFromImage(image, 1.0/255.0, (416,416), [0,0,0], True, crop=False)
Width = image.shape[1]
Height = image.shape[0]
yolo_net.setInput(blob)

outs = yolo_net.forward(getOutputsNames(yolo_net))

class_ids = []
confidences = []
boxes = []
conf_threshold = 0.5
nms_threshold = 0.4

def draw_pred(img, class_id, confidence, x, y, x_plus_w, y_plus_h):

    label = class_id

    color = (255,0,0)

    cv2.rectangle(img, (x,y), (x_plus_w,y_plus_h), color, 2)

    # cv2.putText(img, label, (x-10,y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)


print(len(outs))

for out in outs:
    print(out[0])

    for detection in out:

        #each detection  has the form like this [center_x center_y width height obj_score class_1_score class_2_score ..]
            scores = detection[5:]#classes scores starts from index 5
            class_id = np.argmax(scores)
            confidence = scores[class_id]
            if confidence > 0:
                center_x = int(detection[0] * Width)
                center_y = int(detection[1] * Height)
                w = np.int32(detection[2] * Width)
                h = np.int32(detection[3] * Height)
                x = np.int32(center_x - w / 2)
                y = np.int32(center_y - h / 2)
                class_ids.append(class_id)
                confidences.append(float(confidence))
                try:
                    boxes.append([x, y, w, h])
                except: pass


    print(confidences[:1])

    indices = cv2.dnn.NMSBoxes(boxes[:1], confidences[:1], conf_threshold, nms_threshold)

    for i in indices:
        i = i[0]
        box = boxes[i]
        x = box[0]
        y = box[1]
        w = box[2]
        h = box[3]
        draw_pred(image, class_ids[i], confidences[i], round(x), round(y), round(x+w), round(y+h))


cv2.imwrite('squiggle_yolo_test.png', image)
