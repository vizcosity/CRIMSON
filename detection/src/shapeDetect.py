# Given an image, finds all the shapes and outputs an annotated image illustrating
# the detected shapes as well as a JSON file containing information about the shapes
# and their inferred hierarchy.

from findContainer import getContainers, nestShapes
from shapesToJSON import serialiseShapeHierachy
import cv2
import os
import imutils
import json
import argparse

def outputResultsToDir(dir, filename, json, annotated, containers):
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


if (__name__ == "__main__"):
    # print("WE DOIN IT FAM.")
    ap = argparse.ArgumentParser()
    ap.add_argument("-i", "--image", required=True, help="Input path.")
    ap.add_argument("-o", "--output", required=False)
    args = vars(ap.parse_args())
    # Load the image.
    image = cv2.imread(args["image"])
    # image = imutils.resize(image, width=800)

    # Get containers.
    shapes, appxConts, image, whiteImg = getContainers(image, annotate=True)

    # Get serialised hierarchy.
    jsonHierarchy = serialiseShapeHierachy(shapes)

    if (args['output']):
        filename = args['image'].split('/')[-1].split('.')[0]
        outputResultsToDir(args['output'], filename, jsonHierarchy, image, whiteImg)
    else: print(json.dumps(jsonHierarchy, indent=4))
