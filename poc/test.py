from shape import Shape, nestShapes, addContainedToShape
import numpy as np

shapes = [Shape([(0,0), (0,10), (10,10), (10,0)]), Shape([(2,2), (2,4), (4,4), (4,2)]), Shape([(4,4), (4,8), (8,8), (8,4)])]

neseted, rest = addContainedToShape(shapes[0], shapes[1:])
print("Shape: "+ str([neseted]) + ". Contained in this: " + str(neseted.contained))

nestShapes(shapes)
