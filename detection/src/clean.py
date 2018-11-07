# Set of functions that help to clean up the detected contours and lines
# from the findContainer module.
#
# @ Aaron Baw 2018

import cv2
import numpy as np

# Logging.
def log(message):
    return
    print("CLEAN | " + str(message))

# Given a set of contours, calculates the area for each contour and the midpoint.
# Where two rectangles are detected with similar midpoints and slightly different
# areas, then the larger of the two is kept.
def removeInnerRectangles(shapes, areaPercentageThreshold, distanceThreshold):

    output = shapes.copy()

    for shape in output:

        # areaThreshold = shape.area * areaPercentageThreshold
        # log("Distance threshold of " + str(distanceThreshold))
        # log("Area threshold of " + str(areaThreshold) + " for " + str(shape))

        # Find the distance from this shape and every other shape of the same kind.
        for otherShape in output:

            # Skip iteration if otherShape is smaller than shape.
            if (shape.area > otherShape.area): continue
            if (shape.type != otherShape.type or shape == otherShape): continue

            # areaDifference = abs(shape.area - otherShape.area)
            distance = shape.distance(otherShape)

            # If the rectangles are similar, keep the larger one. It is desired
            # that the outermost bounding rectangle is kept in order to represent
            # containers as accurately as possible.
            if (shape.area / otherShape.area > areaPercentageThreshold and distance < distanceThreshold):

                log("Area Ration between " + str(shape) +"("+str(shape.area)+")" + " and " + str(otherShape) + "("+str(otherShape.area)+")"+ ": " + str(shape.area / otherShape.area))
                log("Distance between " + str(shape) + " and " + str(otherShape) + ": " + str(distance)+". Threshold: "+ str(distanceThreshold))
                log("Midpoint " + str(shape) + " : " + str(shape.midpoint) + ", Midpoint " + str(otherShape) + ": " + str(otherShape.midpoint))
                log("["+str(shape)+"]"+ " and " + "["+str(otherShape)+"]" + " deemed to be similar. Removing ["+str(shape)+"]")

                output = [ s for s in output if s != shape ]

                log("Resulting output: " + str(output))
    return output
