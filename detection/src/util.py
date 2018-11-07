# General helper functions.

import numpy as np

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
