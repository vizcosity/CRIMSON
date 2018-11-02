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

args = argparse.ArgumentParser()
ap = argparse.ArgumentParser()
ap.add_argument("-i", "--image", required=True, help="Input path.")
ap.add_argument("-o", "--output", required=False)
args = vars(ap.parse_args())

# Load the image.
image = cv2.imread(args["image"])
image = imutils.resize(image, width=300)

# Get containers.
shapes, appxConts, image, whiteImg = getContainers(image, annotate=True)

# Get serialised hierarchy.
jsonHierarchy = serialiseShapeHierachy(shapes)

# Output results.
filename = args['image'].split('/')[-1].split('.')[0]
if (not os.path.exists(args['output']+'/'+filename)):
    os.makedirs(args['output']+'/'+filename)
jsonFile = open(args['output']+"/"+filename+"/"+filename+'.json', mode='w')
jsonFile.write(jsonHierarchy)

cv2.imwrite(args['output']+'/'+filename+'/'+filename+'_annotated.png', image)

cv2.imwrite(args['output']+'/'+filename+'/'+filename+'_containers.png', whiteImg)
