# Contains metadata about the shape object detected, including coordinates, both
# absolute and relative, as well as a classification for the basic shape detected.
#
# @ Aaron Baw

import numpy as np
from geometry import *
from util import *
import cv2
import os

def log(message):
    # if (os.environ['PY_DEBUG']): print("SHAPE | " + str(message))
    pass

class Shape:

    def __init__(self, vertices, id=None):
        if (type(vertices) != np.ndarray):
            vertices = np.array(vertices)

        self.id = id
        self.rawVertices = vertices
        self.rawVertices = vertices.reshape(-1,2)
        self.type = determineShapeType(self.rawVertices)
        self.rawArea = calculateArea(self.rawVertices)
        self.vertices = tidyAndApproximate(self.rawVertices, self.type)
        self.edges = getEdges(self.vertices)
        self.midpoint = calculateMidpoint(self.vertices)
        self.area = calculateArea(self.vertices)
        self.width = float(calculateWidth(self.vertices))
        self.height = float(calculateHeight(self.vertices))
        # Level describes the level at which the shape is currently nested.
        # Level 0 refers to the global container, whereas level 1 represents
        # all the containers within the containers at level 0, and so on.
        # Analogous to the depth at which the container lives if it were to be
        # represented with a tree.
        self.level = 0
        # Relative height and width are fractions of the size of the container.
        self.relativeHeight = 1.0
        self.relativeWidth = 1.0
        self.numSides = len(self.vertices)

        # Holds shapes which are contained by the current shape.
        self.contained = []

    def increaseNestLevel(self):
        self.level += 1
        for shape in self.contained:
            shape.level += 1

    def addContainedShape(self,shape):

        # Calculate relative width and height of child.
        shape.relativeWidth = shape.width / self.width
        shape.relativeHeight = shape.height / self.height

        # Add a level to the child shape.
        shape.increaseNestLevel()

        self.contained.append(shape)

    # Returns true if the this contains the shape passed.
    def contains(self,otherShape):

        # Firstly check that *most of* the otherShape is contained within this one.
        # Drawn sketches will include irregularities that mean that there will
        # inevitably be some overlap between shapes. If the distance between
        # edges is within some threshold and *most* of the area of the otherShape
        # is contained within this shape, then we can safely assume that it is
        # meant to be contained within it.

        # Check if all vertices are contained within the current shape by using
        # half-plane insideness. [CS324]
        for edge in self.edges:
            for vertex in otherShape.vertices:
                if not pointWithinPlane(edge, vertex): return False
        return True

    # Calculates euclidean distance between the midpoint of the current shape
    # and the other shape passed.
    def distance(self, shape):
        return np.sqrt( ((shape.midpoint[0] - self.midpoint[0]) ** 2) + ((shape.midpoint[1] - self.midpoint[1]) ** 2) )

    def __str__(self):
        if (self.id is not None): return self.__repr__()
        return \
            "Mid Point: " + str(self.midpoint) + "\n" + \
            "Area: " + str(self.area)
            # "Type: " + self.type + "\n" + \
            # "Raw Vertices: " + str(self.rawVertices[0]) + "\n" + \
            # "Vertices: "+str(self.vertices[0]) + "\n" + \
            # "Width: " + str(self.width) + "\n" + \
            # "Height: " + str(self.height) + "\n" +
    def __repr__(self):
        return str(self.type)+str(self.id)

    # Implementing equality for shapes.
    def __eq__(self, other):
        return self.type == other.type and arrCompare(self.rawVertices, other.rawVertices) and \
            arrCompare(self.vertices, other.vertices) and self.midpoint == other.midpoint and \
            self.width == other.width and self.height == other.height and self.area == other.area

    # Implement comparison for shapes.§
    def __lt__(self, other):
        return self.area < other.area

    def __gt__(self, other):
        return self.area > other.area


# Given the raw vertices detected by cv2.findContour(), and the shape type,
# attempts to return an approximation of the shape with straight lines.
def tidyAndApproximate(vertices, type):
    output = np.array(vertices)

    # print("Tidying :" + str(vertices))

    # TODO: Change approach so that we approximate based off of the angle between
    # successive lines and then average out all the angles to produce a shape with
    # equal angles and straigtened out lines.
    if (type == "rectangle"):
        (x, y, w, h) = cv2.boundingRect(vertices)
        output = np.array([[x, y], [x, y+h], [x+w, y+h], [x+w, y]]).reshape(-1,2)

    # print("Tidied: " + str(output))
    return output

# Sorts shapes in descending order of area.
def sortShapesBySize(shapes):
    kvpArr = np.array([(shape.area, shape) for shape in shapes], dtype=[('area', 'int32'), ('shape', object)])
    kvpArr[::-1].sort(order='area')
    return kvpArr['shape']

# Adds all shapes in 'shapes' which are contained in the 'shape' arg passed,
# returning a tuple containing the shape as well as remaining shapes.
def addContainedToShape(shape, originalShapeList):

    # Make a copy so we don't alter the original list.
    shapes = originalShapeList.copy()
    output = []

    while (len(shapes) > 0):
        # Pop shape.
        shapeToSeeIfContained, shapes = shapes[0], shapes[1:]
        # Skip if the shapeToSeeIfContained is the shape we are adding to.
        if (shapeToSeeIfContained == shape): continue
        if (shape.contains(shapeToSeeIfContained)):
            log("Adding:" + str([shapeToSeeIfContained]) + " to " + str([shape]))
            shape.addContainedShape(shapeToSeeIfContained)
        else:
            # If shapeToSeeIfContained not contained in shape, then we add
            # shapeToSeeIfContained to the output list, as it forms part of one
            # of the remaining shapes we need to process.
            output.append(shapeToSeeIfContained)
    # Output should contain all the shapes that were not added, and shape should
    # now contain all the shapes located within it.
    # Output should still be sorted correctly because we are removing from the
    # front of the shapes list and appending this to the back of the output list.
    return shape, output

# Ensures that all shapes are contained within a global container.
def nestWithinWindow(shapes, imgDimensions):
    # If the output has more than a single shape, then we nest all the shapes within
    # global container equal to the image size.
    if (len(shapes) > 1):
        window = Shape([ [0, 0], [0, imgDimensions[1]], [imgDimensions[0], imgDimensions[1]], [imgDimensions[0], 0] ])
        window.id = "Main Container"
        addContainedToShape(window, shapes)
        shapes = [window]

    return shapes

# Iterates through each shape detected, checking to see if it contains other shapes.
# Returns a dictionary of shapes representing the hierarchical structure.
def nestShapes(shapes):

    if (len(shapes) == 0): return shapes
    # Sort shapes by size.
    shapes = sortShapesBySize(shapes)

    # Pop shape.
    shape, shapes = shapes[0], shapes[1:]

    # print(str([shape])+ " has contained shapes : " + str(shape.contained) + " before nesting.")
    # print("Nesting shapes "+str(shapes)+" into " + str([shape]))

    # Add all shapes which are contained by the current shape to the current shape.
    shape, remaining = addContainedToShape(shape, shapes)

    # print("Shape :" + str([shape]) + " Now has containing shapes: " + str(shape.contained))
    # print("Shapes: " + str(shapes))
    #
    # print("Contained shapes: "+ str(shape.contained))

    # if (len(shapes) == 1): return

    # For all shapes that have been added to the current shape, perform the
    # same procedure recursively.
    shape.contained = nestShapes(shape.contained)

    # Process the rest of the list until it is empty, returning a list containing
    # shapes which contain all others.


    return [shape] + nestShapes(remaining)
