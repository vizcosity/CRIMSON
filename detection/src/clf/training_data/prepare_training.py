# Converts training images from numpy bmp format to dir full of images.

import cv2
import numpy as np

# Read in training data.
images = np.load("full_numpy_bitmap_squiggle.npy")

for i in range(0, len(images)):
    print("Saving image " + str(i))
    cv2.imwrite('squiggle_'+str(i)+".png", images[i].reshape((28,28)))

print("Done.")
