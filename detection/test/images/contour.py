#!/bin/env/python3

# (1) Blurring to denoise
# (2) Gray scaling
# (3) Binarisation

import argparse
import imutils
import cv2
import numpy as np
from matplotlib import pyplot as plt
from matplotlib.widgets import Slider, Button

# Parse arguments.
ap = argparse.ArgumentParser()
ap.add_argument("-i", "--image", required=True, help="Path to input image.")
args = vars(ap.parse_args())

image = cv2.imread(args["image"])
gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
# Remove noise
blurred = cv2.GaussianBlur(gray, (9,9), 0)
thresh = cv2.adaptiveThreshold(blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)

# Try different thresholding methods
# threshes = [
# image,
# gray,
# blurred,
# cv2.adaptiveThreshold(blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2),
# cv2.adaptiveThreshold(blurred, 255, cv2.ADAPTIVE_THRESH_MEAN_C, cv2.THRESH_BINARY, 11, 2),
# cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY)[1],
# cv2.threshold(blurred, 127, 255, cv2.THRESH_BINARY)[1],
# cv2.threshold(blurred, 60, 120, cv2.THRESH_BINARY)[1]
# ]

# titles = ["Original", "Gray", "Blurred", "Adaptive Gaussian", "Adaptive Mean", "Binary (0 - 255)", "Binary (127 - 255)", "Binary (60-120)"]

# for i in range(0, len(titles)):
#     plt.subplot(2,2, i+1)
#     plt.imshow(threshes[i], 'gray')
#     plt.title(titles[i])
#     plt.xticks([])
#     plt.yticks([])
# plt.show()
# plt.waitforbuttonpress(0)
# plt.close()

# cv2.imshow('Thresholding', thresh)
# cv2.waitKey(0)

# Find edges.
# edges = cv2.Canny(image, 50, 200)

# cv2.drawContours(image, [edges], -1, (0, 255, 0), 2)
cv2.imshow("Image", thresh)
cv2.waitKey(0)
