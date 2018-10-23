# This module extracts the coordinates of the vertices of the outermost container
# in the image passed.
#
# References to explore: [https://stackoverflow.com/questions/29156091/opencv-edge-border-detection-based-on-color]

import numpy as np
import argparse
import imutils
import cv2
import random
import math
from shape import Shape

# Remove contours that are smaller than a given threshold, determined by the size
# of the image
def filterContours(contours, imageSize):
    height, width, channels = imageSize

    contours = np.array(contours)

    # Contours with area less than 1% of the image size will be removed.
    threshold = 0.0025 * height * width

    booleanMask = [(cv2.contourArea(cont) > threshold) for cont in contours]

    return contours[booleanMask].tolist()


def getContainers(image):

    print(image.shape)

    # Convert the image to grayscale.
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # Blur the image with a gaussian kernel.
    # We do this in order to filter through and reduce some of the noise we are
    # recieving.
    # blur = cv2.GaussianBlur(gray,( 5, 5), 0)

    # Using otsu's binarisation.
    # This works by analysing the image histogram, a distribution of the particular
    # tones in an image. Each bar represents the frequency of pixels corresponding
    # to that particular tone.
    ret, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY+cv2.THRESH_OTSU)

    # Invert the image so that our desired shapes are highlighted in white.
    invert = cv2.bitwise_not(thresh)

    # Canny edge detection.
    canny = cv2.Canny(image, 100, 200)

    # Finding contours based off of the result of the Canny edge detection.
    # Contour detection in OpenCV finds contours which are white, on a BLACK background.
    # The output of this is a numpy array of (x,y) coordinates of the boundary points
    # of the contours.
    # CHAIN_APPROX_SIMPLE compresses the contours by only storing minimal information
    # about how to represent the lines that make it up (e.g. the endpoints of the lines).
    canny2, contours, hierarchy = cv2.findContours(invert, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)

    # Filter miniscule contours.
    contours = filterContours(contours, image.shape)

    approximatedContours = []
    # Draw the contours to see what we found.
    for cont in contours:

        # Approximate contours.
        # approxCont = averageOut(cont, 50)

        # Approximating with approxPolyDP.
        # Calculate epsilon as a fraction of the perimeter of the contour.
        epsilon = 0.012 * cv2.arcLength(cont, True)
        approx = cv2.approxPolyDP(cont, epsilon, True)

        # print("Contour: " + str(cont) + ". Averaged: " + str(approx))

        approximatedContours.append(approx)

    return ([Shape(contour) for contour in approximatedContours], approximatedContours)

if (__name__ == "__main__"):
    # Read in arguments
    args = argparse.ArgumentParser()
    ap = argparse.ArgumentParser()
    ap.add_argument("-i", "--image", required=True, help="Input path.")
    args = vars(ap.parse_args())

    # Load the image.
    image = cv2.imread(args["image"])
    image = imutils.resize(image, width=300)

    # Find containers
    shapes, containerContours = getContainers(image)

    # Get the approximated container vertices from the shape objects and use
    # this to draw the contours.
    #
    # print([np.array(shape.vertices) for shape in shapes])

    # Add shape type at midpoint of the shape.
    for shape in shapes:
        # If the shape has four vertices, then get the bounding rect.
        if (shape.type == "rectangle"):
            (x, y, w, h) = cv2.boundingRect(shape.vertices)
            cv2.rectangle(image,(x,y),(x+w,y+h),(255,0,0),2)
        print(shape)
        cv2.putText(image, shape.type, (shape.midpoint[0] - 20, shape.midpoint[1]), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (50,50,50))

    # print("Found : " + str(len(containerContours)) + " shapes.")
    cv2.drawContours(image, [np.array(shape.vertices) for shape in shapes], -1, (0,255,0))

    cv2.imshow('Image', image)
    cv2.waitKey(0)
