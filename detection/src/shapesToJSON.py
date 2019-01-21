# Detects shapes, infers a hierarchy of containers by testing insideness
# of each shape with respect to another, outputting a JSON representation of the
# discovered shapes and their hierarchy, to be used for composition of the <div>
# hierarchy.

from findContainer import getContainers
from shape import nestShapes
from functools import *
import cv2
import os
import imutils
import json
import argparse

def composeShapeHierarchy(containers):

    output = []
    for container in containers:

        output.append({
            'id': str(container.id),
            'parentId': str(container.parentId),
            'type': container.type,
            'meta': {
                'absoluteWidth': float(container.width),
                'absoluteHeight': float(container.height),
                'relativeWidth': str(float(container.relativeWidth * 100))+ "%",
                'relativeHeight': str(float(container.relativeHeight * 100)) + "%",
                'midpoint': container.midpoint,
                'area': float(container.area),
                'vertices': container.vertices.tolist(),
                'boundingBox': container.boundingBox.tolist(),
                'relativeVertices': container.relativeVertices
            },
            'content': str(container.content),
            'level': container.level,
            'contains': reduce(lambda prev, next : prev + next, [ composeShapeHierarchy([shape]) for shape in container.contained ], [])
        })

    return output

def serialiseShapeHierachy(shapes):
    return json.dumps(composeShapeHierarchy(shapes), indent=2)


if (__name__ == "__main__"):
    # Read in arguments
    args = argparse.ArgumentParser()
    ap = argparse.ArgumentParser()
    ap.add_argument("-i", "--image", required=True, help="Input path.")
    ap.add_argument("-o", "--output", required=True, help="Output path for serialised json.")
    args = vars(ap.parse_args())

    # Load the image.
    image = cv2.imread(args["image"])
    image = imutils.resize(image, width=300)

    # Get containers from the image as a list of shapes.
    containers, approximatedContours, image, whiteImg = getContainers(image)

    # Infer hierarchy.
    containers = nestShapes(containers)

    # Output JSON file containing information about detected shape hierarchy.
    json = serialiseShapeHierachy(containers)
    if (not os.path.exists(args['output'])): os.makedirs(args['output'])
    file = open(args['output']+'/'+args['image'].split('/')[-1]+".json", mode='w')
    file.write(json)

    print("ShapeToJSON | Wrote serialised shape hierarchy to file.")
