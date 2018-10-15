from shapeDetect import ShapeDetector

import argparse
import imutils
import cv2

# NOTES:
# For unclosed shapes, may be worth looking into convexHull...

ap = argparse.ArgumentParser()
ap.add_argument("-i", "--image", required=True, help="Input path.")
args = vars(ap.parse_args())

image = cv2.imread(args["image"])
image = imutils.resize(image, width=300)

gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
blurred = cv2.GaussianBlur(image, (5,5), 0)
threshA = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)
# thresh = cv2.threshold(gray, 60,200, cv2.THRESH_BINARY)[1]

# Find edges with Canny.
canny = cv2.Canny(threshA, 50, 200)

# Find contours after applying Canny edge detection.
canny2, contours, hierarchy = cv2.findContours(canny, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

# Draw the contours and show what we have found.
cv2.drawContours(image, contours, -1, (0,255,0), 2)

# Approximate the shape for each contour..
for cnt in contours:
    # Investigate what Epsilon does here, and why it is set to this value
    ac = cv2.approxPolyDP(cnt, 0.1 * cv2.arcLength(cnt, True), True)

    # print("Curve approximation: " + str(approximateCurve))
    #
    # print("Number of sides: " + str(len(approximateCurve)))

    # Annotate each shape.
    # Find midpoint between first two points.
    print(ac[0][0])
    midpoint = ((ac[0][0] + ac[1][0]) / 2, (ac[1][0] + ac[1][1]) / 2)
    print("Midpoint: " + midpoint)

cv2.imshow('Canny', image)
cv2.waitKey(0)
