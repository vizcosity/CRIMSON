# This module extracts the coordinates of the vertices of the outermost container
# in the image passed.
#
# References to explore: [https://stackoverflow.com/questions/29156091/opencv-edge-border-detection-based-on-color]

import numpy as np
import argparse
import imutils
import cv2
import random
import os
import math
from clean import *
from util import *
from shape import Shape, nestShapes, nestWithinWindow

_DEBUG = False
_LINE_THICKNESS = 2

# Logging.
def log(message):
    if (_DEBUG): print("FIND CONTAINER | "+str(message))

# Remove contours that are smaller than a given threshold, determined by the size
# of the image
def filterContours(contours, imageSize):
    height, width, channels = imageSize

    contours = np.array(contours)

    # Contours with area less than 1% of the image size will be removed.
    threshold = 0.001 * height * width

    booleanMask = [(cv2.contourArea(cont) > threshold) for cont in contours]

    return contours[booleanMask].tolist()

# Apply convex hull to fill in any gaps in contours.
def fillGaps(contours):
    return [ cv2.convexHull(np.array(cont)) for cont in contours ]

def getContainers(image, annotate=False):

    imgHeight, imgWidth, channels = image.shape

    # Convert the image to grayscale.
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # Blur the image with a gaussian kernel.
    # We do this in order to filter through and reduce some of the noise we are
    # recieving.
    # blur = cv2.GaussianBlur(gray,( 5, 5), 0)

    # Using otsu's binarisation.
    # This works by analysing the image histogram, a distribution of the particular
    # tones in an image. Each bar represents the frequency of pixels corresponding
    # to that particular tone.
    ret, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY+cv2.THRESH_OTSU)

    # Invert the image so that our desired shapes are highlighted in white.
    invert = cv2.bitwise_not(thresh)

    # Canny edge detection.
    canny = cv2.Canny(image, 100, 200)
    # print("Detecting contours for image: " +str(canny))
    cont2, hierarchy2 = cv2.findContours(canny, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    # cv2.drawContours(image, cont2, -1, (255,0,0))

    # Finding contours based off of the result of the Canny edge detection.
    # Contour detection in OpenCV finds contours which are white, on a BLACK background.
    # The output of this is a numpy array of (x,y) coordinates of the boundary points
    # of the contours.
    # CHAIN_APPROX_SIMPLE compresses the contours by only storing minimal information
    # about how to represent the lines that make it up (e.g. the endpoints of the lines).
    contours, hierarchy = cv2.findContours(invert, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    # cv2.drawContours(image, contours, -1, (255,0,0))

    log("Found: "+ str(len(contours))+ " contours.")

    # Filter miniscule contours.
    contours = filterContours(contours, image.shape)

    contours = fillGaps(contours)

    log("Remaining contours after filtering: "+ str(len(contours)))

    approximatedContours = []
    # Draw the contours to see what we found.
    for cont in contours:

        # Approximate contours.
        # approxCont = averageOut(cont, 50)

        # Approximating with approxPolyDP.
        # Calculate epsilon as a fraction of the perimeter of the contour.
        epsilon = 0.012 * cv2.arcLength(cont, True)
        approx = cv2.approxPolyDP(cont, epsilon, True)

        # Add a bounding box to each contour. This will be represented by its
        # own shape type in the ACR. We only add if the bounding polygon has more
        # than 2 vertices, as we don't want noisy lines.
        if (len(approx) > 2): approximatedContours.append(approx)


    # Create shapes.
    shapes = [Shape(id=str(i), vertices=approximatedContours[i]) for i in range(0,len(approximatedContours))]

    # Filter shapes by removing those with area of 0.
    shapes = [shape for shape in shapes if shape.area > 0]

    # Remove inner rectangles detected from each container.
    distanceThreshold = 0.0001 * imgWidth * imgHeight
    # print([cv2.contourArea(shape.vertices) for shape in shapes])
    shapes = removeInnerRectangles(shapes, 0.7, distanceThreshold)

    whiteImg = createWhiteImg((imgHeight, imgWidth))

    # Nest the shapes within each other and ensure all live within a global window.
    shapes = nestShapes(shapes)

    # shapes = nestWithinWindow(shapes, (imgWidth, imgHeight))
    # Set the relative height and width of the top level panels.
    for shape in shapes:
        shape.relativeHeight = shape.height / imgHeight
        shape.relativeWidth = shape.width / imgWidth

    # Filter shapes by removing shapes which are less than 1% of the size of their
    # containers.
    shapes = removeSmallShapes(shapes)

    # Sort shapes by vertical position.
    shapes = sortShapesInVerticalAscendingOrder(shapes)

    # Annotate nested shapes if desired.
    if (annotate):
        annotateNestedShapes(shapes, owner=None, image=image)
        annotateNestedShapes(shapes, owner=None, image=whiteImg)

    return (shapes, approximatedContours, image, whiteImg)

def annotateShapeTypes(shapes, image):
    # Annotate shape type at midpoint of the shape.
    for shape in shapes:
        # If the shape has four vertices, then get the bounding rect.
        # if (shape.type == "rectangle"):
            # (x, y, w, h) = cv2.boundingRect(shape.rawVertices)
            # cv2.rectangle(image,(x,y),(x+w,y+h),(255,0,0),1)
        # print(shape)
        cv2.putText(image, shape.type[0], (shape.midpoint[0] - 20, shape.midpoint[1]), cv2.FONT_HERSHEY_SIMPLEX, _LINE_THICKNESS, (50,50,50))

# Annotates by shape name, adding information about what shape contains it if so.
def annotateNestedShapes(shapes, owner=None, image=None):
    if (len(shapes) == 0): return
    # print("Annotating nested shapes with owner : "+ str(owner))
    for shape in shapes:

        # Annotate bounding box for the shape.
        (x, y, w, h) = cv2.boundingRect(shape.rawVertices)
        cv2.rectangle(image,(x,y),(x+w,y+h),(255,0,0),1)

        if (shape.type == 'rectangle'):
            cv2.rectangle(image, tuple(shape.vertices[0]), tuple(shape.vertices[2]), color=(0,0,255), thickness=_LINE_THICKNESS)
        else:
            cv2.drawContours(image, [np.array(shape.vertices) for shape in shapes], -1, (0,0,255))
        cv2.putText(image, (str(owner) + ": " if str(owner) is not None else "") + str(shape), (shape.vertices[0][0] + 5, shape.vertices[0][1] + 10), cv2.FONT_HERSHEY_SIMPLEX, 1, (50,50,50), thickness=_LINE_THICKNESS)
        # Call recursively for all shapes that this shape contains.
        annotateNestedShapes(shape.contained, owner=shape, image=image)



def createWhiteImg(size):
    # Create white image.
    return np.zeros((size[0], size[1],3)) + 255

if (__name__ == "__main__"):
    # Read in arguments
    args = argparse.ArgumentParser()
    ap = argparse.ArgumentParser()
    ap.add_argument("-i", "--image", required=True, help="Input path.")
    ap.add_argument("-o", "--output", required=False)
    args = vars(ap.parse_args())

    # Load the image.
    image = cv2.imread(args["image"])
    image = imutils.resize(image, width=300)

    # Create white image.
    whiteImg = np.zeros((image.shape[0],image.shape[1],3)) + 255

    # Find containers
    shapes, containerContours = getContainers(image)

    # shapes = [shape for shape in shapes if shape.area != 0]

    print("Detected " + str(len(shapes)) + " shapes in image.")

    for shape in shapes:
        print(shape.area)

    print("Nesting shapes contained within each other.")
    nested = nestShapes(shapes)
    print("Nested: " + str(nested))

    print("Annotating nested shapes.")
    annotateNestedShapes(nested, owner=None, image=image)
    annotateNestedShapes(nested, owner=None, image=whiteImg)

    # Get the approximated container vertices from the shape objects and use
    # this to draw the contours.
    cv2.drawContours(image, [np.array(shape.vertices) for shape in shapes], -1, (0,0,255))
    cv2.drawContours(whiteImg, [np.array(shape.vertices) for shape in shapes], -1, (0,0,255))

    if (args['output']):
        fileName = args['image'].split('/')[-1]
        outputDir = "../test/output/"+fileName.split('.')[0]
        if (not os.path.exists(outputDir)): os.makedirs(outputDir)
        cv2.imwrite(outputDir+"/annotated.png", image)
        cv2.imwrite(outputDir+"/containers.png", whiteImg)
    else:
        cv2.imshow('Image', image)
        cv2.waitKey(0)
