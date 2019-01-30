# General helper functions.

import numpy as np

# Re-numbers all shapeIds present in the ACR hierachy.
def renumberShapeIds(shapes, parentId=None, lastShapeId=0):

    if (shapes is None or len(shapes) == 0): return shapes, lastShapeId

    # Perform a DFS, and renumber all the shape IDs sequentially.
    for shape in shapes:
        shape.id = lastShapeId = lastShapeId + 1
        shape.parentId = parentId
        shape.contains, lastShapeId = renumberShapeIds(shape.contained, shape.id, lastShapeId)

    return shapes, lastShapeId

# Returns true if two arrays are equal
def arrCompare(arr1, arr2):
    if (len(arr1) != len(arr2)): return False
    for i in range(0, len(arr1)):
        equal = arr1[i] == arr2[i] if type(arr1[i]) != type(arr1) else arrCompare(arr1[i], arr2[i])
        if (not equal): return False
    return True

# No guaruntee the ordering of shape array will match that of the vertical layout.
# Sorts by y value of the midpoint of each shape.
def sortShapesInVerticalAscendingOrder(shapes):
    shapes = np.array([(shape.midpoint[1], shape) for shape in shapes], dtype=[('vertPos', 'int'), ('shape', 'object')])
    shapes.sort()

    shapes = [shape for midpoint, shape in shapes]

    # Sort contained shapes in ascending order too.
    for shape in shapes:
        # print(shape)
        shape.contained = sortShapesInVerticalAscendingOrder(shape.contained)

    return shapes
