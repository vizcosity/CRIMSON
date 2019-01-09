# Draws a sequence of random shapes from the design language in order to
# use for negative training samples and testing.

import cv2
import numpy as np
import imutils
import random

# Divides the bounding container into a number of grid cells.
def divideContainerIntoGrid(img, bound, axis, amount):

    if (bound is None):
        bound = ((0,0),(img.shape[0], img.shape[1]))

    # print(axis)

    # Get tuple position for other axis.
    otherAxis = (len(bound) - 1) - axis

    # print("oteher : "+ str(otherAxis))

    # print(bound)

    boundVertLength = abs(bound[1][axis] - bound[0][axis])
    # print(boundVertLength)

    step = int(boundVertLength / amount);
    offset = step

    lines = []

    for x in range(bound[0][axis]+step, bound[1][axis], step):
        startPt =  list(bound[0])
        startPt[axis] += offset
        offset += step
        # endPt = [bound[1][axis], bound[0][axis]]
        endPt = [0, 0]
        endPt[axis] = startPt[axis]
        endPt[otherAxis] = bound[1][otherAxis]
        # endPt[axis] += x
        startPt = tuple(startPt)
        endPt = tuple(endPt)
        # print("StartPt: "+ str(startPt))
        # print("EndPt: "+ str(endPt))
        lines.append((startPt, endPt))
        cv2.line(img, startPt, endPt, (0,0,0))

    return lines


# Draw a container of random size within a rectangular bound specified.
def drawRandomContainer(img, bound, minSizeProportion, nestedCount=0):

    if (bound is None):
        bound = ((0,0),(img.shape[0], img.shape[1]))

    # print("Bound: " + str(bound))

    # Get coordinates for the bounding container.
    topLeftBound, bottomRightBound = bound
    boundWidth = bottomRightBound[0] - topLeftBound[0]
    boundHeight = bottomRightBound[1] - topLeftBound[1]

    minSizeX = round(minSizeProportion[0] * boundWidth)
    minSizeY = round(minSizeProportion[1] * boundHeight)

    # Generate the points randomly, within the container.
    topLeftX = random.randint(topLeftBound[0], bottomRightBound[0] - minSizeX)
    bottomRightX = random.randint(topLeftX + minSizeX, bottomRightBound[0])


    topLeftY = random.randint(topLeftBound[1], bottomRightBound[1] - minSizeY)
    bottomRightY = random.randint(topLeftY + minSizeY, bottomRightBound[1])

    topLeftPt = (topLeftX, topLeftY)
    bottomRightPt = (bottomRightX, bottomRightY)
    drawnRect = (topLeftPt, bottomRightPt)

    # cv2.line(img, topLeftPt, bottomRightPt, (0,0,0))
    cv2.rectangle(img, topLeftPt, bottomRightPt, (0,0,0), 2)

    return [drawnRect] + drawRandomContainer(img, drawnRect, minSizeProportion, nestedCount - 1) \
        if nestedCount > 0 else [drawnRect]

def drawContainer(image, topLeft, bottomRight):
    cv2.rectangle(image, topLeft, bottomRight, (0,0,0), 2)


def generateImage(imgSize, i):

    imgSize = (imgSize[0],imgSize[1])

    whiteImg = np.zeros((imgSize[0],imgSize[1],3)) + 255

    windowBound = ((10,10), (imgSize[0]-10, imgSize[0] - 10))

    # Draw our main window.
    # drawContainer(whiteImg, windowBound[0], windowBound[1])

    # rects = drawRandomContainer(whiteImg, bound=windowBound, minSizeProportion=(0.5,0.5), nestedCount=1)
    # grid = divideContainerIntoGrid(whiteImg, rects[len(rects) - 1], axis=random.randint(0,1), amount=random.randint(0,10))
    # grid = divideContainerIntoGrid(whiteImg, bound=None, axis=0, amount=5)
    # name = 'c_'+hex(hash(str(grid + rects)))
    print('Writing to file.')
    cv2.imwrite('squiggle_neg/squiggle_neg_white'+str(i)+'.png', imutils.resize(whiteImg, width=80, height=80))

if (__name__ == "__main__"):

    numSamples = 10

    print("Generating "+str(numSamples)+" negative samples. ")

    for i in range(0, numSamples):
        print("Generating negative sample: "+ str(i))
        try:
            generateImage((128,128), i)
        except Exception as e:
            print("Could not generate image  " + str(i) + " " + str(e))
            i = i - 1
