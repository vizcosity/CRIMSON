# Set of functions that help to clean up the detected contours and lines
# from the findContainer module.
#
# @ Aaron Baw 2018

import cv2
import numpy as np
from geometry import *

# Logging.
def log(message):
    return
    print("CLEAN | " + str(message))

# Obtains points which are positioned nearby the point according to 'distance'.
def getNearbyPoints(point, points, distance):

    # log("Point: " + str(point) + ". Points: " + str(points))

    nearbyX = getSimilarValuesWithinRange([x for x, y in points], point[0], distance)
    nearbyY = getSimilarValuesWithinRange([y for x, y in points], point[1], distance)

    log("NearbyX: " + str(nearbyX[:,1]))
    log("NearbyY: " + str(nearbyY))

    # Get intersection of indeces of points where the
    # axis values which are 'distance' pixels away from the point
    commonIndeces = np.intersect1d(nearbyX[:,1], nearbyY[:,1])

    # Convert indeces to ints.
    commonIndeces = [int(i) for i in commonIndeces]

    log("Common indeces: " + str(commonIndeces))

    nearby = np.array(points)[commonIndeces] if len(commonIndeces) > 0 else []

    log("Nearby points from : " + str(point) + " : " + str(nearby))

    # Return nearby points.
    return nearby, commonIndeces

# Alternative implementation which uses Euclidean distane.
def getNearbyEucPoints(point, points, distance):
    return [pt for pt in points if euclideanDistance(point, pt) <= distance]

# Averages all points within 'distance' pixels of each other.
# TODO: Optimise performance by ensuring we are not re-looping over points which
# have already been averaged...
def filterOverlappingIntersections(intersections, distance):

    filtered = []

    for point in intersections:
        # toAverage, indeces = getNearbyPoints(point, intersections, distance)
        toAverage = getNearbyEucPoints(point, intersections, distance)

        # Average points.
        averagedX = round(np.mean([x for x, y in toAverage]))
        averagedY = round(np.mean([y for x, y in toAverage]))

        # log("Averaged poitn: " + )
        filtered.append((averagedX, averagedY))

        log(len(filtered))

    # Squash all unique points together.
    filtered = list(set(filtered))

    log("Filtered: " + str(len(intersections) - len(filtered)) + " intersections within \
    a distance of " + str(distance)+".")

    return filtered
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

            # print(shape)
            # print(otherShape)
            # print("Shape distance: " + str(distance))
            # print("Dist thresh:" + str(distanceThreshold))
            # print("Area "+str(shape) + " " + str(shape.area) + " , " + str(otherShape)+ " " + str(otherShape.area))
            # print("Area ratio: "+ str(shape.area / otherShape.area))
            # print("Raw area ratio: "+ str(shape.rawArea / otherShape.rawArea))

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

# Removes fragments which are smaller than 1% of the size of the container.
def removeContainingFragments(container, shapes):
    # print(shapes)
    # for shape in shapes:
        # print("Checking " + str(shape) + " should be removed from " + str(container))
        # if (shape.area < 0.025 * container.area):
            # print(str(shape) + " is too small within " + str(container))
    return [ shape for shape in shapes if shape.area > 0.02 * container.area]

# Remove containing fragments for all shapes passed.
def removeSmallShapes(shapes):
    if (shapes is None or len(shapes) == 0): return shapes
    output = []
    for shape in shapes:
        # shape.contained = removeSmallShapes(shapes.contained)
        shape.contained = removeContainingFragments(shape,  removeSmallShapes(shape.contained))
        output.append(shape)
    return output
