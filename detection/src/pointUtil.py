# A set of useful functions for manipulating the vertices obtained from the
# contour detection.
#
# @ Aaron Baw 2018.


# Round value up to neareest <int> provided.
def roundUpToNearest(int, val):
    return math.floor( (int + val) / int) * int

def dist(p0, p1):
    return math.sqrt( (p1[0] - p0[0]) ** 2 + (p1[1] - p0[1]) ** 2 )


def avgPoints(points):
    output = [0,0]
    for point in points:
        output[0] += point[0]
        output[1] += point[1]
    output = [math.floor(x / len(output) + 0.5) for x in output]
    return output


# Averages out the endpoints of each line representing a contour to obtain an
# approximation of the shape.
def averageOut(contour, threshold):
    # Check we are not averaging just a single contour.
    if (len(contour) == 1): return contour
    points = contour.reshape(-1,2)
    output = points.copy()
    # Reshape because OpenCV array shapes have a strange convention.
    i = 1
    for x in range(1, len(output)):
        # print("i:" + str(i) + ", size: " + str(len(output)))
        p0 = output[i]
        p1 = output[i - 1]
        # print("P0:" + str(p0) + ", P1:"+str(p1))
        # If distance between points is below threshold, average the points.
        if (dist(p0, p1) <= threshold):
            output[i] = avgPoints([p0, p1])
            output = np.delete(output, [(i-1) * 2, ((i-1) * 2)+ 1]).reshape(-1,2)
            # Decrement i since the array is now one element smaller.
            i -= 1
        i += 1
        # print("Output :" + str(output))
    # Return the output to conform with standard OpenCV array shape.
    return output.reshape(-1, 1, 2)
