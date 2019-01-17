# Detects crosses in images used for image element inference.

import numpy as np
import argparse
import imutils
import cv2
import random
import os
import math
import importlib
from geometry import euclideanDistance
from shape import Shape
from isect_segments_bentley_ottmann import poly_point_isect as bot
from clean import filterOverlappingIntersections
from shape import *

_DEBUG = False

# Logging.
def log(message):
    if (_DEBUG): print("CROSS DETECT | "+str(message))


# def convertToCartesian(lines):
#     output = []
#     for i in range(0, len(lines), 2):
#         start = lines[i].ravel()
#         end = lines[i + 1].ravel()
#         print("Start: "+ str(start))
#         x = start[1] * math.cos(start[0])
#         y = end[1] *  math.sin(end[0])
#         output.append((x, y))
#     return output

# Looks through shapes and nests the intersection within the shape of highest
# nesting level. Returns the highest level shape containing the intersection.
def nestIntersection(intersection, shapes):

    if (len(shapes) == 0): return None

    # Notion of not having a containing shape.
    highestLevelShape = Shape([(-1,-1)])
    highestLevelShape.level = -1

    for shape in shapes:

        if shape.containsPoint(intersection) and shape.level > highestLevelShape.level:
            highestLevelShape = shape
            log(str(shape) + " contains " + str(intersection))

        if highestLevelShape.level == -1: continue

        # Check recursively for shapes which are contained.
        highestLevelShapeContained = nestIntersection(intersection, highestLevelShape.contained)

        if (highestLevelShapeContained is not None): highestLevelShape = highestLevelShapeContained

    return highestLevelShape if highestLevelShape.level != -1 else None

# Looks through the shapes and returns shape of highest level such
# that the shape contains the line at its vertical centre.
def getHighestLvlShapeContainingLineAtCentre(line, shapes):

    if (len(shapes) == 0): return None

    # Notion of not having a containing shape.
    highestLevelShape = Shape([-1,-1])
    highestLevelShape.level = -1

    for shape in shapes:

        # Check if shape contains the line.
        if shape.contains(line):

            # Get the highest level shape recursively from contained components.
            highestLevelContainedShape = getHighestLvlShapeContainingLineAtCentre(line, shape.contained)
            if highestLevelContainedShape is None: highestLevelContainedShape = highestLevelShape

            # Ensure that the line is roughly around the vertical centre of the
            # containing shape.
            if abs(line.midpoint[1] - shape.midpoint[1]) <= 15:
                # New shape candidate.
                if shape.level > highestLevelShape.level: highestLevelShape = shape

                # Check that any contained shapes do not contain the line at some
                # higher nesting level.
                if highestLevelContainedShape.level > highestLevelShape.level:
                    highestLevelShape = highestLevelContainedShape

    return highestLevelShape if highestLevelShape.level != -1 else None


# The same as the method above, except the intersections are added the shape of highest
# nest level where the intersection is located roughly around the center.
def nestCenteredIntersection(intersection, shapes):

    if (len(shapes) == 0): return None

    # Notion of not having a containing shape.
    highestLevelShape = Shape([(-1,-1)])
    highestLevelShape.level = -1

    # log(shapes)

    for shape in shapes:

        # Only interested in assigning centered intersections into prospective
        # containers.
        # if not shape.type == "rectangle": continue
        if not shape.containsPoint(intersection): continue

        log("Checking if " + str(intersection) + " centered within " + str(shape))

        # Recursively examine all the contained shapes to extract the containing shape
        # with the highest level.
        highestLevelShapeContainingCenteredPoint = nestCenteredIntersection(intersection, shape.contained)
        # Reassign to shape with same level as highestLevelShape if method returns
        # None.
        highestLevelShapeContainingCenteredPoint = \
            highestLevelShape if highestLevelShapeContainingCenteredPoint is None \
            else highestLevelShapeContainingCenteredPoint

        # Check to see if the current shape is a candidate for housing the intersection
        # at its centre. If so, we assign it to the 'higehstLevelShape'. It will get
        # compared and replaced by any higher level shapes in the comparison
        # below.
        if (shape.level > highestLevelShape.level \
            and euclideanDistance(shape.midpoint, intersection) <= 25):
            highestLevelShape = shape

        # Check recursively for shapes which are contained.
        # highestLevelShapeContained = nestCenteredIntersection(intersection, highestLevelShape.contained)

        # If both the current shape and any of its contained children do not house
        # the intersection at their centre, we skip the iteratin.
        if highestLevelShape.level == -1 \
         and highestLevelShapeContainingCenteredPoint.level == -1: continue

        # If highestLevelShapeContainingCenteredPoint is assigned a value, then it
        # will be of a higher level, and so we can make this the highestLevelShape
        # and return it.
        if (highestLevelShapeContainingCenteredPoint.level > highestLevelShape.level):
            highestLevelShape = highestLevelShapeContainingCenteredPoint

    # log("Found centered shape: " + str(highestLevelShape if highestLevelShape.level != -1 else None))
    return highestLevelShape if highestLevelShape.level != -1 else None

def nestIntersections(intersections, shapes, image, lastShapeId, annotate):

    idIndex = lastShapeId
    for i in range(0, len(intersections)):

        intersection = intersections[i]

        highestLevelContainingShape = nestIntersection(intersection, shapes)
        highestLevelShapeContainingIntAtCentre = nestCenteredIntersection(intersection, shapes)

        # Intersection could not be nested.
        if (highestLevelContainingShape is None):
            log('Intersection ' + str(intersection) +  ' could not be nested.')
            continue

        log("Adding intersection " + str(intersection) + " to " + str(highestLevelContainingShape))
        log("Adding (centered) intersection " + str(intersection) + " to " + str(highestLevelShapeContainingIntAtCentre))

        intersectionShape = Shape([intersection], id=lastShapeId + idIndex, shapeType="intersection")
        idIndex += 1
        centeredIntersectionShape = Shape([intersection], id=lastShapeId + idIndex, shapeType="centered_intersection")
        idIndex += 1

        # Add the intersections to the shapes.
        highestLevelContainingShape.addContainedShape(intersectionShape)
        if (highestLevelShapeContainingIntAtCentre is not None):
            highestLevelShapeContainingIntAtCentre.addContainedShape(centeredIntersectionShape)

        # Annotate intersection.
        if annotate:
            cv2.putText(image, str(highestLevelContainingShape) + ":" + str(intersectionShape), (intersectionShape.midpoint[0] - 20, intersectionShape.midpoint[1]), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (50,50,50))


    return shapes

def drawIntersections(intersections, image, annotate):
    log("Drawing " + str(len(intersections)) + " intersections.")
    for inter in intersections:
        a, b = inter
        for i in range(3):
            for j in range(3):
                # print(i >= image.shape[0])
                if i+int(b) >= image.shape[0] or j+int(a)>= image.shape[1]: continue
                image[int(b) + i, int(a) + j] = [0, 255, 0]
    return image

# Detects intersections and nests them within shapes that contain the intersection
# points of the highest nesting level.
def detectAndNestIntersections(image, shapes, lastShapeId, annotate):

    # Detect lines.
    lines = detectLines(image)

    # Detect intersections.
    intersections = detectIntersections(lines)

    # Draw intersections on image.
    image = drawIntersections(intersections, image, annotate)

    return nestIntersections(intersections, shapes, image, lastShapeId, annotate), intersections, image

# Given a list of lines extracted from an image, calculates the points at which
# intersections between the lines take place, using the Bentley Ottman algorithm.
# Ref: https://github.com/ideasman42/isect_segments-bentley_ottmann
# TODO: Develop an understanding of how the algorithm works for the writeup.
def detectIntersections(lines):

    points = []

    if (lines is not None):
        for line in lines:
            # Convert lines obtained from HoughLinesP into a tuple of two points each
            # defined with floats instead of ints.
            for x1, y1, x2, y2 in line:
                points.append(((x1 + 0.0, y1 + 0.0), (x2 + 0.0, y2 + 0.0)))

    # Calculate intersections.
    try:
        intersections = bot.isect_segments(points)
    except:
        log("Could not find intersections for " + str(len(lines)) + " detected.")
        intersections = []

    # Filter intersections within a window defined by the size of the image.
    # Intersections which are positions close to each other are averaged out.
    intersections = filterOverlappingIntersections(intersections, 20)

    return intersections

def drawLines(lines, image):

    for line in lines:
        x1, y1, x2, y2 = line.ravel()
        cv2.line(image, (x1, y1), (x2, y2), (100,200,10))

    return image

def nestCenteredLines(lines, shapes, image, lastShapeId, annotate):

    idIndex = lastShapeId

    for line in lines:
        x1, y1, x2, y2 = line.ravel()
        line = Shape([[x1, y1], [x2, y2]], shapeType="centered_line", id=idIndex)

        # Skip if the line is not horizontal.
        if line.height > line.width: continue

        idIndex += 1

        # Get highest level containing shape (at centre)
        containingShape = getHighestLvlShapeContainingLineAtCentre(line, shapes)

        if containingShape is None: continue

        containingShape.addContainedShape(line)

    return shapes

def detectAndNestLines(image, shapes, lastShapeId, annotate, debug=False):

    # Detect lines.
    lines = detectLines(image, erode=False)

    # Draw the lines.
    if annotate: drawLines(lines, image)

    # cv2.imshow('image', image)
    # cv2.waitKey(0)

    # Nest lines within shapes.
    shapes = nestCenteredLines(lines, shapes, image, lastShapeId, annotate)

    # Return shapes, lines and image.
    return shapes, lines, image

def detectLines(image, debug=False, erode=True):

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

        # Blur the image.
        blurred = cv2.GaussianBlur(invert, (5,5), 0)

        if (debug): cv2.imwrite('blurred.png', blurred)

        # Erode the image to remove double line specifically around crosses.
        # erode_kernel = np.ones((2,2))
        preCannyImage = blurred
        if erode:
            # TODO: Here we attempt to extract what's known as the 'morphological' skeleton;
            # This in essence is the shape which appears after we repeatedly erode and
            # dilate a particular image with respect to a kernel designed to target
            # particular structures. Here, we want to find the skeleton pertaining to
            # imaegs, and so we use a 'cross' structuring element.
            erode_kernel = cv2.getStructuringElement(cv2.MORPH_CROSS, (3,3))
            preCannyImage = cv2.erode(blurred, erode_kernel, iterations=2)
            if (debug): cv2.imwrite('eroded.png', preCannyImage)

        # Canny edge detection.
        canny = cv2.Canny(preCannyImage, 100, 200)

        cont2, hierarchy2 = cv2.findContours(canny, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)

        # Detect lines.
        # The 2nd last paramter is the minimum line length, while the lat parameter
        # refers to the maximum gap between lines to warrant a 'grouping'.
        lines = cv2.HoughLinesP(canny, 1, float(math.pi / 180) * float(1), 10, np.array([]), 10, 7)
        # lines = cv2.HoughLinesP(canny, 1, float(math.pi / 180) * float(1), 10, np.array([]), 10, 20)

        log("Detected " + str(len(lines)) + " lines.")

        # if (debug):
        #     cv2.imwrite('intersection.png', image)
        #     for line in lines:
        #         line = line.ravel()
        #         start = (line[0], line[1])
        #         end = (line[2], line[3])
        #         cv2.line(image, start, end, (0,0,255))

        if (debug):
            intersections = detectIntersections(lines)
            cv2.imwrite('intersections.png', drawIntersections(intersections, image, True))

        return lines



if (__name__ == "__main__"):

    _DEBUG = True

    # Read in arguments
    args = argparse.ArgumentParser()
    ap = argparse.ArgumentParser()
    ap.add_argument("-i", "--image", required=True, help="Input path.")
    ap.add_argument("-o", "--output", required=False)
    args = vars(ap.parse_args())

    # Load the image.
    image = cv2.imread(args["image"])
    image = imutils.resize(image, width=300)


    # Get the approximated container vertices from the shape objects and use
    # this to draw the contours.
    # cv2.drawContours(image, [np.array(shape.vertices) for shape in shapes], -1, (0,0,255))
    # cv2.drawContours(whiteImg, [np.array(shape.vertices) for shape in shapes], -1, (0,0,255))
    lines = detectLines(image, debug=True, erode=False)
    # print(detectLines(image))

    # Write detected lines to image.
    lineImage = cv2.imread(args["image"])
    lineImage = imutils.resize(lineImage, width=300)
    for line in lines:
        x1, y1, x2, y2 = line.ravel()
        cv2.line(lineImage, (x1, y1), (x2, y2), (0,0,255))
    cv2.imwrite('lines.png', lineImage)
    # cv2.waitKey(0)
