from shapeDetect import ShapeDetector
import numpy as np
import argparse
import imutils
import cv2

ap = argparse.ArgumentParser()
ap.add_argument("-i", "--image", required=True, help="Input path.")
args = vars(ap.parse_args())

image = cv2.imread(args["image"])
image = imutils.resize(image, width=300)

gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
blurred = cv2.GaussianBlur(image, (5,5), 0)
# threshA = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)
thresh = cv2.threshold(gray, 60,150, cv2.THRESH_BINARY)[1]
cv2.imshow('Threshold', thresh)

# Find edges with Canny.
canny = cv2.Canny(thresh, 25, 200)

print(canny)

# Find contours after applying Canny edge detection.
canny2, contours, hierarchy = cv2.findContours(canny, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

# Draw the contours and show what we have found.
cv2.drawContours(image, contours, -1, (0,255,0), 1)

acs = []
# print(contours)
# print(np.ndarray(contours).shape)
# Approximate the shape for each contour..
for cnt in contours:

    # Investigate what Epsilon does here, and why it is set to this value
    ac = cv2.approxPolyDP(cnt, 0.1 * cv2.arcLength(cnt, True), True)

    # print("CONTOUR: " + str(cnt))
    # print("APPROXIMATED LINE: " + str(ac))
    print("Num Sides: " + str(len(ac)))
    acs.append(ac)

    if (len(ac) <= 1):
        continue

    # Get the two points that represent the endpoints of the approximated contour line.
    p0 = ac[0][0]
    p1 = ac[1][0]

    # Annotate each shape.
    # Find midpoint between first two points.
    midpoint = ((p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2)
    print("Midpoint: " + str(midpoint))

# print(np.array(acs))
cv2.polylines(image, np.array(acs), True, (255,255,0), 1)
# print(acs.reshape(-1,1,2))
# cv2.imshow('Approx', acs)
cv2.imshow('Canny', image)
cv2.waitKey(0)
