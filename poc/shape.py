# Contains metadata about the shape object detected, including coordinates, both
# absolute and relative, as well as a classification for the basic shape detected.
#
# @ Aaron Baw

import numpy as np
import cv2

class Shape:

    def __init__(self, vertices, contained=None):
        if (type(vertices) != np.ndarray):
            vertices = np.array(vertices)
        self.rawVertices = vertices
        self.rawVertices = vertices.reshape(-1,2)
        self.type = self.determineShapeType()
        self.rawArea = self.calculateArea(self.rawVertices)
        self.vertices = self.tidyAndApproximate()
        self.edges = self.getEdges()
        self.midpoint = self.calculateMidpoint()
        self.area = self.calculateArea(self.vertices)
        self.width = self.calculateWidth()
        self.height = self.calculateHeight()
        self.numSides = len(self.vertices)

        # Holds shapes which are contained by the current shape.
        self.contained = contained

    def calculateMidpoint(self):
        return [int(round(np.mean(self.vertices[:,0]))), int(round(np.mean(self.vertices[:,1])))]

    def calculateWidth(self):
        return self.vertices[:,0].max() - self.vertices[:,0].min()

    def calculateHeight(self):
        return self.vertices[:,1].max() - self.vertices[:,1].min()

    def determineShapeType(self):
        if (len(self.rawVertices) == 3): return "triangle"
        if (len(self.rawVertices) == 4): return "rectangle"
        else: return "polygon"

    def calculateArea(self, vertices):
        return cv2.contourArea(vertices)

    # Returns a list of edge lines that compose the shape.
    def getEdges(self):
        edges = []
        print("Vertices: "+ str(self.vertices))
        for i in range(0, len(self.vertices) -1):
            edge = (self.vertices[i], self.vertices[i+1])
            # print("Adding edge: "+ str(edge))
            edges.append(edge)
        edges.append((self.vertices[-1], self.vertices[0]))
        return edges



    # Returns true if the this contains the shape passed.
    def contains(self,otherShape):
        # Check if all vertices are contained within the current shape by using
        # half-plane insideness. [CS324]

        for edge in self.edges:
            for vertex in otherShape.vertices:
                if not pointWithinPlane(edge, vertex): return False

        return True

    # Calculates euclidean distance between the midpoint of the current shape
    # and the other shape passed.
    def distance(self, shape):
        return np.sqrt( (shape.midpoint[0] - self.midpoint[0]) ** 2 + (self.midpoint[1] - self.midpoint[1]) ** 2 )

    # Given the raw vertices detected by cv2.findContour(), and the shape type,
    # attempts to return an approximation of the shape with straight lines.
    def tidyAndApproximate(self):
        output = np.array(self.rawVertices)
        if (self.type == "rectangle"):
            # Iterate over each x coordinate. If the x-coordinates diverge by
            # a small amount (< 5 pixels), then we average the two, keeping the
            # y values intact.
            output[:,0] = straightenAlongAxis(output[:,0], int(self.rawArea) * 0.05)
            output[:,1] = straightenAlongAxis(output[:,1], int(self.rawArea) * 0.05)
        return output





    def __str__(self):
        return \
            "Mid Point: " + str(self.midpoint) + "\n" + \
            "Area: " + str(self.area) + "\n"
            # "Type: " + self.type + "\n" + \
            # "Raw Vertices: " + str(self.rawVertices[0]) + "\n" + \
            # "Vertices: "+str(self.vertices[0]) + "\n" + \
            # "Width: " + str(self.width) + "\n" + \
            # "Height: " + str(self.height) + "\n" +

    # Implementing equality for shapes.
    def __eq__(self, other):
        return self.type == other.type and arrCompare(self.rawVertices, other.rawVertices) and \
            arrCompare(self.vertices, other.vertices) and self.midpoint == other.midpoint and \
            self.width == other.width and self.height == other.height and self.area == other.area

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


# Returns true if two arrays are equal
def arrCompare(arr1, arr2):
    if (len(arr1) != len(arr2)): return False
    for i in range(0, len(arr1)):
        equal = arr1[i] == arr2[i] if type(arr1[i]) != type(arr1) else arrCompare(arr1[i], arr2[i])
        if (not equal): return False
    return True

# For each coordinate along some axis, find the similar coordinates within a
# distance of 5 pixels, then group and average them out.
def straightenAlongAxis(xs, threshold):
    # Ensure array is ndarray.
    if (type(xs) != np.ndarray):
        xs = np.array(xs)
    output = xs.copy()

    return straighten(output, threshold)



def straighten(xs, threshold):
    # print("Straightening: " + str(xs))
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

# poly = Shape([[2,1],[10,1],[10,10],[1,10]])
# print(poly)
# print(poly.vertices[:,0])
# print(poly.vertices[:,1])
# print([np.mean(poly.vertices[:,0]), np.mean(poly.vertices[:,1])])
# array = [123,142,11,14,11,24,12,10,9]
# print(straightenAlongAxis(array, 5))
# print(array)
