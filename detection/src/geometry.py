# Utility functions for calculating properties needed for approximating vertices
# and testing insideness of shapes with respect to other shapes.

import numpy as np
import cv2
import math

_DEBUG = False

# Calculates the intersectio over union score for two given boxes. Neither of
# these boxes represent ground truth, and so the score is simply used as
# an estimate of how much the two boxes overlap with each other.
#
# Method by PyImageSearch:
# https://www.pyimagesearch.com/2016/11/07/intersection-over-union-iou-for-object-detection/
def calc_iou(boxVerts, otherBoxVerts, debug=False):
    _DEBUG = debug
    (bx1, by1), _, (bx3, by3), _ = boxVerts
    (ox1, oy1), _, (ox3, oy3), _ = otherBoxVerts

    i1 = [max(bx1, ox1), max(by1, oy1)]
    i3 = [min(bx3, ox3), min(by3, oy3)]

    log("Box: "+ str(boxVerts))
    log("OtherBox: " + str(otherBoxVerts))

    intersection_vertices = [i1, [i1[0], i3[1]], i3, [i3[0], i1[1]]]

    log("Intersection: " + str(intersection_vertices))
    intersection_area = max((i3[1] - i1[1]) + 1, 0) * max((i3[0] - i1[0]) + 1, 0)


    log("intersection area: " + str(intersection_area))
    box_area = (by3 - by1) * (bx3 - bx1)

    log("box area: " + str(box_area))
    otherBox_area = (oy3 - oy1) * (ox3 - ox1)

    log("other box area: " + str(otherBox_area))

    iou = float(intersection_area) / (float(box_area) + float(otherBox_area) -  float(intersection_area))


    log("IOU : "+ str(iou))
    # Return IOU. We remove the intersection_area from the added box areas so that
    # we dont count the intersection area twice. (Since we are interested in
    # the union of the two areas).
    return iou

def getBoundingBox(vertices):
    (x, y, w, h) = cv2.boundingRect(vertices)
    return np.array([[x, y], [x, y+h], [x+w, y+h], [x+w, y]]).reshape(-1,2)

# Returns a list of edge lines that compose the shape.
def getEdges(vertices):
    edges = []
    for i in range(0, len(vertices) -1):
        edge = (vertices[i], vertices[i+1])
        # print("Adding edge: "+ str(edge))
        edges.append(edge)
    edges.append((vertices[-1], vertices[0]))
    return edges

# Returns a vector representing the equation of the implicit line equation of
# the form ax + by + c, which will be used to test the insideness of points.
def calulateImplicitLineEquation(line):

    p1, p2 = line

    # Fin
    m = (p2[0] - p1[0]) / (p2[1] - p1[1])
    c = p1[1] - (m * p1[0])

    # Construct row vector.
    eqn = [-m, 1, -c]
    # print(eqn)
    return eqn

# Checks if the point passed is on or beneath the line.
# If line is along an axis and pointing up, checks if the point is to the right of the line.
# If line pointing right, checks if point below line.
# where direction is taken from the start point to the end point of the line.
def pointWithinPlane(line, p):

    # Check if the line is along an axis.
    startPoint, endPoint = line

    # print("Line: "+ str(line))
    # print("Start : "+ str(startPoint) + ", End: "+ str(endPoint))
    # print("Pt: "+str(p))

    if (startPoint[0] == endPoint[0]):
        # Determine direction of line.
        if (startPoint[1] < endPoint[1]):
            # Direction is up, check if point is to the right of line.
            return p[0] > startPoint[0]
        # Direction is down, check if point is to the left of the line.
        else: return p[0] < startPoint[0]

    if (startPoint[1] == endPoint[1]):
        # Determine direction of line.
        if (startPoint[0] < endPoint[0]):
            # Line is pointing right, check if point is below line.
            return p[1] < startPoint[1]
        else:
            # Direction is left, check if point is above line.
            return p[1] > startPoint[1]

    # When using insideness testing, we assume that the vertical axis has increasing
    # y values along the upward direction. We flip the y-axis here to reflect this.
    # line = ( (startPoint[0], -startPoint[1]), (endPoint[0], -endPoint[1]) )

    # If line not along axis, construct implicit equation.
    eqn = calulateImplicitLineEquation(line)

    # print(np.dot([p[0], p[1], 1], eqn) < 0)

    return np.dot([p[0], p[1], 1], eqn) < 0

def euclideanDistance(point1, point2):
    dist = math.sqrt( (point1[0] - point2[0]) ** 2 + (point1[1] - point2[1]) ** 2 )
    # print("Distance between " + str(point1) + ", and " + str(point2) + ": " + str(dist))
    return dist

# For each coordinate along some axis, find the similar coordinates within a
# distance of 5 pixels, then group and average them out.
def straightenAlongAxis(xs, threshold):
    # Ensure array is ndarray.
    if (type(xs) != np.ndarray):
        xs = np.array(xs)
    output = xs.copy()

    return straighten(output, threshold)

def straighten(xs, threshold):
    print("Straightening with threshold: "+ str(threshold))
    straightened = False
    for x in xs:
        skewedXs = getSimilarValuesWithinRange(xs, x, threshold)
        # print("SkewedAxisVals: " + str(skewedXs))
        # print("Xs: " + str(xs))
        # print("Replaceing : " + str(skewedXs[:,0]) + " with: " + str(round(np.mean(skewedXs[:,0]))))
        if (len(np.unique(skewedXs) > 1)): straightened = False
        # Average out the coordinate values.
        skewedXs[:,0] = round(np.mean(skewedXs[:,0]))


        # Replace all coordinate values in 'xs' array with the new
        # averaged values at the index positions where they originally
        # occurred.
        xs[skewedXs[:,1]] = skewedXs[:,0]
        # print("Xs[After]: " + str(xs))
    return straighten(xs,threshold) if straightened else xs

# Given an array, returns a 2d array containing the element and the index position
# at which it occurs.
def getSimilarValuesWithinRange(array, element, threshold):
    output = []
    for i in range(0, len(array)):
        item = array[i]
        if (abs(item - element) <= threshold):
            output.append([item, i])
    # print("Similar Values: " + str(output))
    return np.array(output)

def calculateMidpoint(vertices):
    return [int(round(np.mean(vertices[:,0]))), int(round(np.mean(vertices[:,1])))]

def calculateWidth(vertices):
    return vertices[:,0].max() - vertices[:,0].min()

def calculateHeight(vertices):
    return vertices[:,1].max() - vertices[:,1].min()

# Given absolute vertex coordinates, and the parent container, calculates the
# coordinates of the vertices as a % distance from the top left vertex.
def calculateRelativeVertices(origin, width, height, parentVertices, vertices):
    return [
        [
            ((x - parentVertices[0][0]) / width) if width != 0 else 0,
            ((y - parentVertices[0][1]) / height) if height != 0 else 0
        ] for [x, y] in vertices
    ]

def determineShapeType(vertices):
    if (len(vertices) == 1): return "point"
    if (len(vertices) == 2): return "line"
    if (len(vertices) == 3): return "triangle"
    if (len(vertices) == 4): return "rectangle"
    else: return "polygon"

def calculateArea(vertices):
    return cv2.contourArea(vertices) if len(vertices) > 2 else 0

def log(msg):
    if (_DEBUG): print("GEOMETRY | " + str(msg))
