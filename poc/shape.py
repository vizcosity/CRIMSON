# Contains metadata about the shape object detected, including coordinates, both
# absolute and relative, as well as a classification for the basic shape detected.
#
# @ Aaron Baw

import numpy as np

class Shape:

    def __init__(self, vertices):
        if (type(vertices) != np.ndarray):
            vertices = np.array(vertices)
        self.rawVertices = vertices
        self.rawVertices = vertices.reshape(-1,2)
        self.type = self.determineShapeType()
        self.vertices = self.tidyAndApproximate()
        self.midpoint = self.calculateMidpoint()
        self.width = self.calculateWidth()
        self.height = self.calculateHeight()
        self.numSides = len(self.vertices)

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

    # Given the raw vertices detected by cv2.findContour(), and the shape type,
    # attempts to return an approximation of the shape with straight lines.
    def tidyAndApproximate(self):
        output = np.array(self.rawVertices)
        if (self.type == "rectangle"):
            # Iterate over each x coordinate. If the x-coordinates diverge by
            # a small amount (< 5 pixels), then we average the two, keeping the
            # y values intact.
            output[:,0] = straightenAlongAxis(output[:,0], 20)
            output[:,1] = straightenAlongAxis(output[:,1], 20)
        return output





    def __str__(self):
        return \
            "Type: " + self.type + "\n" + \
            "Raw Vertices: " + str(self.rawVertices) + "\n" + \
            "Vertices: "+str(self.vertices) + "\n" + \
            "Mid Point: " + str(self.midpoint) + "\n" + \
            "Width: " + str(self.width) + "\n" + \
            "Height: " + str(self.height)


# For each coordinate along some axis, find the similar coordinates within a
# distance of 5 pixels, then group and average them out.
def straightenAlongAxis(xs, threshold):
    # Ensure array is ndarray.
    if (type(xs) != np.ndarray):
        xs = np.array(xs)
    output = xs.copy()

    return straighten(output, threshold)



def straighten(xs, threshold):
    print("Straightening: " + str(xs))
    straightened = False
    for x in xs:
        skewedXs = getSimilarValuesWithinRange(xs, x, threshold)
        print("SkewedAxisVals: " + str(skewedXs))
        print("Xs: " + str(xs))
        print("Replaceing : " + str(skewedXs[:,0]) + " with: " + str(round(np.mean(skewedXs[:,0]))))
        if (len(np.unique(skewedXs) > 1)): straightened = False
        # Average out the coordinate values.
        skewedXs[:,0] = round(np.mean(skewedXs[:,0]))


        # Replace all coordinate values in 'xs' array with the new
        # averaged values at the index positions where they originally
        # occurred.
        xs[skewedXs[:,1]] = skewedXs[:,0]
        print("Xs[After]: " + str(xs))
    return straighten(xs,threshold) if straightened else xs

# Given an array, returns a 2d array containing the element and the index position
# at which it occurs.
def getSimilarValuesWithinRange(array, element, threshold):
    output = []
    for i in range(0, len(array)):
        item = array[i]
        if (abs(item - element) <= threshold):
            output.append([item, i])
    print("Similar Values: " + str(output))
    return np.array(output)

# poly = Shape([[2,1],[10,1],[10,10],[1,10]])
# print(poly)
# print(poly.vertices[:,0])
# print(poly.vertices[:,1])
# print([np.mean(poly.vertices[:,0]), np.mean(poly.vertices[:,1])])
# array = [123,142,11,14,11,24,12,10,9]
# print(straightenAlongAxis(array, 5))
# print(array)
