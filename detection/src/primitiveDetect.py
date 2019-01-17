# This module aims to resolve conflicts between the set of shapes which are
# detected during the first stage of the detection pipeline, using traditional
# image processing, binarisation, and contour detection techniques, with the
# set of predicted primitives which are returned from CNN classification.
#
# Since classification of primitives using the CNN tends to be robust, we leverage
# the reliable bounding boxes predicted by the detection pipeline to correctly
# classify the boxes.
#
# @ Aaron Baw 2018

from shape import Shape
import numpy as np

# Shapes with an IOU score greater than the below will be resolved into a single
# classification.
_IOU_THRESHOLD = 0.5
_DEBUG = True

def addNewShape(shapes, newShape):
    log("No intersecting shapes for " + str(newShape) + ". Creating one now.")
    for shape in shapes:
        if shape.contains(newShape):
            shape.nest(newShape)
            return

    # If no shapes contain the predicted primitive, add it to the highest
    # level.
    log("No shapes contain newShape " + str(newShape) + ". Adding it to the highest level.")
    shapes.append(newShape)

def resolveShapesUsingPredictions(primitives, shapes, lastShapeId):

    # For each primitive we detect using the CNN, match it up to a corresponding
    # shape we detected. We do this by computing the overlap between the two
    # bounding boxes, and assigning the primitive classification where there
    # is a high degree of intersection.
    for primitive in primitives:
        box, vertices, label, id, confidence = primitive
        predictedShape = Shape(vertices, id=lastShapeId, shapeType=label)
        lastShapeId = lastShapeId + 1

        intersecting_shapes = [
                (shape, shape.calc_iou(predictedShape)) for shape in shapes
                if shape.calc_iou(predictedShape) >= _IOU_THRESHOLD
            ]

        log("Intersecting shapes: " + str(intersecting_shapes))

        # Sort intersecting shapes by largest intersections.
        intersecting_shapes = np.array(intersecting_shapes, dtype=[('shapes', list), ('iou', float)]).sort(order='iou')

        if (intersecting_shapes is None or len(intersecting_shapes) == 0):
            return addNewShape(shapes, predictedShape)

        if (len(intersecting_shapes) >= 1):
            log("Multiple intersecting shapes for predicted primitive :" + label)



        # Assign the shape with the largest overlap the classification from
        # the predicted primitive.
        intersecting_shapes[-1].type = label
        log("Classifying "+str(intersecting_shapes[-1] + " as " + label))

    return shapes

def log(msg):
    if (_DEBUG): print("PRIMITIVE DETECT | " + str(msg))
