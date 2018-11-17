# Detects crosses in images used for image element inference.

import numpy as np
import argparse
import imutils
import cv2
import random
import os
import math
from shape import *

_DEBUG = False

# Logging.
def log(message):
    if (_DEBUG): print("CROSS DETECT | "+str(message))


# def convertToCartesian(lines):
#     output = []
#     for i in range(0, len(lines), 2):
#         start = lines[i].ravel()
#         end = lines[i + 1].ravel()
#         print("Start: "+ str(start))
#         x = start[1] * math.cos(start[0])
#         y = end[1] *  math.sin(end[0])
#         output.append((x, y))
#     return output


def detectLines(image):

        imgHeight, imgWidth, channels = image.shape

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

        cann3, cont2, hierarchy2 = cv2.findContours(canny, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)

        # canny2, contours, hierarchy = cv2.findContours(invert, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)

        # Detect lines.
        lines = cv2.HoughLinesP(invert, 1, float(math.pi / 180) * float(1), 10)

        for line in lines:
            line = line.ravel()
            start = (line[0], line[1])
            end = (line[2], line[3])
            cv2.line(image, start, end, (0,0,255))

        print(lines)



if (__name__ == "__main__"):
    # Read in arguments
    args = argparse.ArgumentParser()
    ap = argparse.ArgumentParser()
    ap.add_argument("-i", "--image", required=True, help="Input path.")
    ap.add_argument("-o", "--output", required=False)
    args = vars(ap.parse_args())

    # Load the image.
    image = cv2.imread(args["image"])
    image = imutils.resize(image, width=300)


    # Get the approximated container vertices from the shape objects and use
    # this to draw the contours.
    # cv2.drawContours(image, [np.array(shape.vertices) for shape in shapes], -1, (0,0,255))
    # cv2.drawContours(whiteImg, [np.array(shape.vertices) for shape in shapes], -1, (0,0,255))
    detectLines(image)
    # print(detectLines(image))

    # cv2.imshow('Lines', image)
    cv2.imwrite('lines.png', image)
    cv2.waitKey(0)
