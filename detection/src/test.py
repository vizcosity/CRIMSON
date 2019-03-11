# Perform canny edge detection and save the resultself.
import cv2
import imutils
import numpy as np

image = cv2.imread('sample.png')

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

contours, hierarchy = cv2.findContours(invert, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)

whiteImg = np.ones(image.shape) * 255

cv2.drawContours(whiteImg, contours, -1, (0,0,255))

cv2.imwrite('sample_contours.png', whiteImg)
