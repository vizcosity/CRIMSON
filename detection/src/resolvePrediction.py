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
_DEBUG = False

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

# Returns a list of shapes and their ious which intersect with the primitive.
# Shape IDs are also returned in case the objects added to the array are not
# references to the objects in the shape array.
def getIntersectingShapes(primitive, shapes, iou_threshold):

    intersecting_shapes = []

    if shapes is None or len(shapes) == 0: return intersecting_shapes

    for shape in shapes:

        # log("Examining intersection between primitive "+str(primitive.type) + " and shape " + str(shape))

        intersecting_shapes_contained_within_shape = getIntersectingShapes(primitive, shape.contained, iou_threshold)

        # log("Currenet intersecting shapes: "+ str(intersecting_shapes))
        # log("Intersecting shapes contained within " +str(shape) + ": " + str(intersecting_shapes_contained_within_shape))


        # Call recursively on children of the current shape.
        intersecting_shapes = intersecting_shapes + intersecting_shapes_contained_within_shape

        # intersecting_shapes = np.concatenate([intersecting_shapes, intersecting_shapes_contained_within_shape]).tolist()

        iou_val = shape.calc_iou(primitive)
        if iou_val >= iou_threshold:
            intersecting_shapes.append((shape, iou_val))

    return intersecting_shapes

def mergeShapeWithPrimitive(primitiveShape, intersectingShape, iou):

    intersectingShape.type = primitiveShape.type

    log("Classifying "+str(intersectingShape) + " as " + str(primitiveShape.type))

    # Set the vertices of the intersectingshape to its bounding box.
    intersectingShape.vertices = intersectingShape.boundingBox

    # TODO: Examine if we should consult the confidence score & iou in order to see
    # if we should instead keep the bounding box produced by the neural network.

    # Set content for the intersectingShape.
    intersectingShape.content = primitiveShape.content

    # Once we classify a shape, since it can no longer be a container, we
    # remove all the containing shapes.
    intersectingShape.contained = []

# Given a list of text predictions from some image, and a list of shape primitives
# previously detected, finds shapes which have a high degree of intersection with
# the bounding boxes returned from the text detection, and populates the content
# for the respective text component accordingly.
def resolveTextUsingPredictions(textPredictions, shapes, lastShapeId):

    for text, bounding_rect in textPredictions:
        predicted_bounding_rect = Shape(bounding_rect, shapeType="header", content=text)
        intersecting_shapes = getIntersectingShapes(predicted_bounding_rect, shapes, _IOU_THRESHOLD)
        # Sort intersecting shapes by largest intersections.
        intersecting_shapes = np.array(intersecting_shapes, dtype=[('shape', Shape), ('iou', float)])
        intersecting_shapes.sort(order='iou')
        if (len(intersecting_shapes) >= 1):
            intersecting_shape, iou = intersecting_shapes[-1]
            mergeShapeWithPrimitive(predicted_bounding_rect, intersecting_shape, iou)

    return shapes

def resolveShapesUsingPredictions(primitives, shapes, lastShapeId):

    # For each primitive we detect using the CNN, match it up to a corresponding
    # shape we detected. We do this by computing the overlap between the two
    # bounding boxes, and assigning the primitive classification where there
    # is a high degree of intersection.
    for primitive in primitives:
        box, vertices, label, id, confidence = primitive
        log("Resolving predicted primitive: " + str(label))
        predictedShape = Shape(vertices, id=lastShapeId, shapeType=label)
        lastShapeId = lastShapeId + 1

        intersecting_shapes = getIntersectingShapes(predictedShape, shapes, _IOU_THRESHOLD)

        # Sort intersecting shapes by largest intersections.
        intersecting_shapes = np.array(intersecting_shapes, dtype=[('shape', Shape), ('iou', float)])
        intersecting_shapes.sort(order='iou')

        log("Intersecting shapes: " + str(intersecting_shapes))

        if (intersecting_shapes is None or len(intersecting_shapes) == 0):
            addNewShape(shapes, predictedShape)
        elif (len(intersecting_shapes) >= 1):

            # Assign the shape with the largest overlap the classification from
            # the predicted primitive.
            intersecting_shape, iou_val = intersecting_shapes[-1]
            mergeShapeWithPrimitive(predictedShape, intersecting_shape, iou_val)

    return shapes

def log(msg):
    if (_DEBUG): print("PRIMITIVE DETECT | " + str(msg))
