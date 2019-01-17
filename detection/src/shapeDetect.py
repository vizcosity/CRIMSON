# Given an image, finds all the shapes and outputs an annotated image illustrating
# the detected shapes as well as a JSON file containing information about the shapes
# and their inferred hierarchy.

from findContainer import getContainers, nestShapes
from detectLine import detectAndNestIntersections, detectAndNestLines
from shapesToJSON import serialiseShapeHierachy
from clf.yolo_cnn_detector import predict_primitives
from primitiveDetect import resolveShapesUsingPredictions
import cv2
import os
import imutils
import json
import argparse

def outputResultsToDir(dir, filename, json, annotated, containers, intersections, lines):
    # Output results.

    # If the output argument has been passed, then we write the output to the
    # directory specified along with all the shape annotation. Otherwise we
    # assume that the script is being called from another process and should
    # simply print the produced JSON to the stdout stream.
    if (not os.path.exists(dir+'/'+filename)):
        os.makedirs(dir+'/'+filename)
    jsonFile = open(dir+"/"+filename+"/"+filename+'.json', mode='w')
    jsonFile.write(json)

    cv2.imwrite(args['output']+'/'+filename+'/'+filename+'_annotated.png', annotated)

    cv2.imwrite(args['output']+'/'+filename+'/'+filename+'_containers.png', containers)

    cv2.imwrite(args['output']+'/'+filename+'/'+filename+'_intersections.png', intersections)

    cv2.imwrite(args['output']+'/'+filename+'/'+filename+'_lines.png', lines)


def getFreshImage(imagePath):
    image = cv2.imread(imagePath)
    image = imutils.resize(image, width=300)
    return image

if (__name__ == "__main__"):
    # print("WE DOIN IT FAM.")
    ap = argparse.ArgumentParser()
    ap.add_argument("-i", "--image", required=True, help="Input path.")
    ap.add_argument("-o", "--output", required=False)
    args = vars(ap.parse_args())
    # Load the image.
    originalImg = cv2.imread(args["image"])
    image = cv2.imread(args["image"])
    originalImg = imutils.resize(originalImg, width=300)
    image = imutils.resize(image, width=300)


    # Get containers.
    shapes, appxConts, containerImg, whiteImg = getContainers(image, annotate=True)

    # Detect presence of complex shape primitives using YOLO CNN.
    primitives = predict_primitives(getFreshImage(args['image']))

    lastShapeId = len(appxConts)

    # For each container, detect the intersections within the container in order to infer
    # images in the inference pipeline.
    # Need to pass in the 'lastShapeId' so that we enumerate intersection shape ids
    # starting from the last detected shape id in the getContainers method.
    shapes, intersections, intersectionImg = detectAndNestIntersections(originalImg, shapes, lastShapeId=lastShapeId, annotate=True)

    # Update lastShapeId
    lastShapeId += len(intersections)

    # For each container, detect lines and nest horizontal lines which occur
    # roughly around the vertical center of the container.
    shapes, lines, lineImg = detectAndNestLines(getFreshImage(args["image"]), shapes, lastShapeId=lastShapeId, annotate=True)

    # print("SHAPES AFTER NESTING INTERSECTIONS:  "+ str(shapes) + ", " + str(shapes[0].contained))

    lastShapeId += len(lines)

    print(shapes)
    
    # Given the predicted primitives and the shapes collected from the previous
    # step, attempt to identify each shape correctly using bounding box information
    # and the set of predicted primitives from CNN classification.
    shapes = resolveShapesUsingPredictions(primitives, shapes, lastShapeId)

    # Get serialised hierarchy.
    jsonHierarchy = serialiseShapeHierachy(shapes)

    if (args['output']):
        filename = args['image'].split('/')[-1].split('.')[0]
        outputResultsToDir(args['output'], filename, jsonHierarchy, containerImg, whiteImg, intersectionImg, lineImg)
    else: print(json.dumps(jsonHierarchy, indent=4))
