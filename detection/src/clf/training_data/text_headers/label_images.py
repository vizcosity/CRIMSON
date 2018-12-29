# Label the training data by adding a bounding box to each shape.

import cv2
import numpy as np
import glob

# The squiggles provided by google quickdraw unfortunatley contain a great
# deal of non-horizontal squiggles. This module reads in each image, and
# applies a bounding box to the content. Where the bounding box height is significant,
# we filter the image.

# The bounding boxes are also used to annotate the squiggles for training.
# YOLOv3 Label format: <object-class> <x> <y> <width> <height> (Ref: https://github.com/AlexeyAB/Yolo_mark/issues/60)

import cv2
import numpy as p
import glob

# Returns the bounding box for the image passed. If there is more than one
# bounding box, or if the bounding box is not a horizontal rectangle, then
# returns None.
def getBoundingBoxes(image):

    # Apply canny edge detection & contours detection. Image is already inverted, greyed and thresholded.
    # Find the contours.
    canny, contours, hierarchy = cv2.findContours(image, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)

    # if (len(contours) > 1): return None

    boxes = []

    for cont in contours:
        box = cv2.boundingRect(cont)
        boxes.append(box)
        # (x, y, w, h) = box
        # Draw rectangle for debugging
        # cv2.rectangle(image,(x,y),(x+w,y+h),(255,0,0),1)

    return boxes

    # box = cv2.boundingRect(contours[0])

    # Desire the width of the rectangle to be at least twice that of the height
    # to ensure we only keep high quality squiggles.
    # return box if box[2] >= 2 * box[3] else None

    # # Get bounding box for squiggly.
    # for cont in contours:
    #     (x, y, w, h) = cv2.boundingRect(cont)
    #     cv2.rectangle(image,(x,y),(x+w,y+h),(255,0,0),1)

    # cv2.imwrite('samples/squiggle_bounded.png', image)

def getMidPoint(boundingBox):
    (x, y, w, h) = boundingBox
    return (x + w/2, y + h/2)

def generateLabel(image, boundingBox, midpoint, class_number):

    imHeight, imWidth = image.shape

    _, _, w, h = boundingBox
    x, y = midpoint

    # Need to convert these relative to width and height of the image.
    x = float(x) / float(imWidth)
    y = float(y) / float(imHeight)

    w = w / imWidth
    h = h / imHeight

    return class_number +" "+str(x) + " " + str(y) + " " + str(float(w)) + " " + str(float(h))

def generateLabelsFromImage(image, class_number):
    boxes = getBoundingBoxes(image)
    label = ""
    for box in boxes:
        if (box is None): continue
        midpoint = getMidPoint(box)
        label += generateLabel(image, box, midpoint, class_number) + "\n"

    # Remove the trailing newline character from the label.
    return label[:-2]

def writeFile(file, path):
    f = open(path, 'w')
    f.write(file)

filename = 'embedded_samples.png'

# Read in file.
image = cv2.imread(filename)
image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
ret, image = cv2.threshold(image, 0, 255, cv2.THRESH_BINARY+cv2.THRESH_OTSU)
# Invert the image.
image = cv2.bitwise_not(image)
labels = generateLabelsFromImage(image, "0")
print("Labelling: "+ filename)
print(labels)

writeFile(labels, './prepared/'+str(filename.split('.')[0])+'.txt')

# Write the image next to the text file.
cv2.imwrite('./prepared/'+filename, image)



# writeFile(generateLabelFromImage(image), 'squiggle_yolo/squiggle_5.txt')
