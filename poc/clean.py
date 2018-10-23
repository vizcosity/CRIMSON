# Set of functions that help to clean up the detected contours and lines
# from the findContainer module.
#
# @ Aaron Baw 2018

import cv2
import numpy as np

# Given a set of contours, calculates the area for each contour and the midpoint.
# Where two rectangles are detected with similar midpoints and slightly different
# areas, then the larger of the two is kept.
def removeInnerRectangles(shapes, areaPercentageThreshold, distanceThreshold):

    output = shapes.copy()

    for shape in shapes:

        areaThreshold = shape.area * areaPercentageThreshold
        print("Distance threshold of " + str(distanceThreshold))
        print("Area threshold of " + str(areaThreshold) + " for " + str(shape))

        # Find the distance from this shape and every other shape of the same kind.
        for otherShape in output:
            if (shape.type != otherShape.type or shape == otherShape): continue
            areaDifference = abs(shape.area - otherShape.area)
            distance = shape.distance(otherShape)

            # If the rectangles are similar, keep the larger one. It is desired
            # that the outermost bounding rectangle is kept in order to represent
            # containers as accurately as possible.
            if (areaDifference < areaThreshold and distance < distanceThreshold):

                smallerShape = shape if shape.area < otherShape.area else otherShape

                print("["+str(shape)+"]"+ " and " + "["+str(otherShape)+"]" + " deemed to be similar. Removing ["+str(smallerShape)+"]")

                output = [ shape for shape in output if shape != smallerShape ]

                print("Resulting output: " + str(output))
    return output
