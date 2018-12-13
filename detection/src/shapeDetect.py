# Given an image, finds all the shapes and outputs an annotated image illustrating
# the detected shapes as well as a JSON file containing information about the shapes
# and their inferred hierarchy.

from findContainer import getContainers, nestShapes
from detectIntersections import detectAndNestIntersections
from shapesToJSON import serialiseShapeHierachy
import cv2
import os
import imutils
import json
import argparse

def outputResultsToDir(dir, filename, json, annotated, containers, intersections):
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

    # print("SHAPES BEFORE NESTING INTERSECTIONS:  "+ str(shapes) + ", " + str(shapes[0].contained))


    # For each container, detect the intersections within the container in order to infer
    # images in the inference pipeline.
    # Need to pass in the 'lastShapeId' so that we enumerate intersection shape ids
    # starting from the last detected shape id in the getContainers method.
    shapes, intersections, intersectionImg = detectAndNestIntersections(originalImg, shapes, lastShapeId=len(appxConts), annotate=True)

    # print("SHAPES AFTER NESTING INTERSECTIONS:  "+ str(shapes) + ", " + str(shapes[0].contained))

    # Get serialised hierarchy.
    jsonHierarchy = serialiseShapeHierachy(shapes)

    if (args['output']):
        filename = args['image'].split('/')[-1].split('.')[0]
        outputResultsToDir(args['output'], filename, jsonHierarchy, containerImg, whiteImg, intersectionImg)
    else: print(json.dumps(jsonHierarchy, indent=4))
