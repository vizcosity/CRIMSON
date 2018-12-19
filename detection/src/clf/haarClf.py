# Haar classification demo detecting the presence of 'squiggly' lines
# which will then be used to detect text headers.
# @ Aaron Baw 2018

import cv2
import imutils
import numpy as np

# Read in sample with a squiggly line (propsective text header)
headerImage = cv2.imread('training_data/samples/drawn.png')
headerImage = imutils.resize(headerImage, width=300)
# convert to grayscale
headerImage = cv2.cvtColor(headerImage, cv2.COLOR_BGR2GRAY)

# Invert.
# Using otsu's binarisation.
# This works by analysing the image histogram, a distribution of the particular
# tones in an image. Each bar represents the frequency of pixels corresponding
# to that particular tone.
ret, thresh = cv2.threshold(headerImage, 0, 255, cv2.THRESH_BINARY+cv2.THRESH_OTSU)

# Invert the image so that our desired shapes are highlighted in white.
invert = cv2.bitwise_not(thresh)


# Load classifier.
squiggle_cascade = cv2.CascadeClassifier('training_data/cascade/cascade.xml')

# Find squiggles in image.
squiggles = squiggle_cascade.detectMultiScale(invert, 1.5, 10)

for (x, y, w, h) in squiggles:
      cv2.rectangle(invert,(x,y),(x+w,y+h),(255,0,0),2)

cv2.imwrite('training_data/samples/squiggle_detect_3.png', invert)
