# Utility functions for calculating properties needed for approximating vertices
# and testing insideness of shapes with respect to other shapes.

import numpy as np
import cv2

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
    return eqn

# Checks if the point passed is on or beneath the line.
# If line is along an axis and pointing up, checks if the point is to the right of the line.
# If line pointing right, checks if point below line.
# where direction is taken from the start point to the end point of the line.
def pointWithinPlane(line, p):
    # Check if the line is along an axis.
    startPoint, endPoint = line

    # print("Line: "+ str(line))
    # print("Stat : "+ str(startPoint) + ", End: "+ str(endPoint))
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

    # If line not along axis, construct implicit equation.
    eqn = calulateImplicitLineEquation(line)

    return np.dot([p[0], p[1], 1], eqn) < 0

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

def determineShapeType(vertices):
    if (len(vertices) == 3): return "triangle"
    if (len(vertices) == 4): return "rectangle"
    else: return "polygon"

def calculateArea(vertices):
    return cv2.contourArea(vertices)
