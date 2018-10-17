# This module extracts the coordinates of the vertices of the outermost container
# in the image passed.

import numpy as np
import argparse
import imutils
import cv2
import random
import math

# Read in arguments
args = argparse.ArgumentParser()
ap = argparse.ArgumentParser()
ap.add_argument("-i", "--image", required=True, help="Input path.")
args = vars(ap.parse_args())

def getShapeContours(image):

    # Load the image.
    image = cv2.imread(args["image"])
    image = imutils.resize(image, width=300)

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


    approximatedContours = []
    # Draw the contours to see what we found.
    for cont in contours:

        # Approximate contours.
        # approxCont = averageOut(cont, 50)

        # Approximating with approxPolyDP.
        # Calculate epsilon as a fraction of the perimeter of the contour.
        epsilon = 0.01 * cv2.arcLength(cont, True)
        approx = cv2.approxPolyDP(cont, epsilon, True)

        # print("Contour: " + str(cont) + ". Averaged: " + str(approx))

        approximatedContours.append(approx)


    # cv2.drawContours(image, approximatedContours, -1, (0,255,0))

    # print("Found : " + str(len(approximatedContours)) + " shapes.")

    # cv2.imshow('Image', image)
    # cv2.waitKey(0)
