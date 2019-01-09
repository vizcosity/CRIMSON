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
def getBoundingBox(image):

    # Apply canny edge detection & contours detection. Image is already inverted, greyed and thresholded.
    # Find the contours.
    canny, contours, hierarchy = cv2.findContours(image, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)

    if (len(contours) > 1): return None

    box = cv2.boundingRect(contours[0])

    # Desire the width of the rectangle to be at least twice that of the height
    # to ensure we only keep high quality squiggles.
    return box if box[2] >= 2 * box[3] else None

    # # Get bounding box for squiggly.
    # for cont in contours:
    #     (x, y, w, h) = cv2.boundingRect(cont)
    #     cv2.rectangle(image,(x,y),(x+w,y+h),(255,0,0),1)

    # cv2.imwrite('samples/squiggle_bounded.png', image)

def getMidPoint(boundingBox):
    (x, y, w, h) = boundingBox
    return (x + w/2, y + h/2)

def generateLabel(image, boundingBox, midpoint):

    imHeight, imWidth = image.shape

    _, _, w, h = boundingBox
    x, y = midpoint

    # Need to convert these relative to width and height of the image.
    x = float(x) / float(imWidth)
    y = float(y) / float(imHeight)

    w = w / imWidth
    h = h / imHeight

    return "0 "+str(x) + " " + str(y) + " " + str(float(w)) + " " + str(float(h))

def generateLabelFromImage(image):
    boundingBox = getBoundingBox(image)
    if (boundingBox is None): return None
    midpoint = getMidPoint(boundingBox)
    return generateLabel(image, boundingBox, midpoint)

def writeFile(file, path):
    f = open(path, 'w')
    f.write(file)

# Read in images.
imagePaths = glob.glob('squiggle_pos/*.png')

# Annotate the first 10,000 images only.
for imgPath in imagePaths[:10000]:

    # Read in file.
    image = cv2.imread(imgPath)
    image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    label = generateLabelFromImage(image)
    if (label is None): continue
    fileName = imgPath.split('/')[1]
    print("Labelling: "+ fileName)
    print(label)

    writeFile(label, 'squiggle_yolo/'+str(fileName.split('.')[0])+'.txt')

    # Write the image next to the text file.
    cv2.imwrite('squiggle_yolo/'+fileName, image)



# writeFile(generateLabelFromImage(image), 'squiggle_yolo/squiggle_5.txt')
