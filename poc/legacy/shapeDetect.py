import cv2

class ShapeDetector:
    def __init__(self):
        pass

    def detect(self, contour):
        shape = "unknown"
        perimiter = cv2.arcLength(contour, True)
        approx = cv2.approxPolyDP(contour, 0.04 * perimiter, True)

        if len(approx) == 3:
            shape = "triangle"

        elif len(approx) == 4:

            # Get the bounding box of the contour, and use this
            # to compute the aspect ratio.
            (x, y, w, h) = cv2.boundingRect(approx)
            ar = w / float(h)

            # Squares have aspect ratio approx equal to 1.
            shape == "square" if ar >= 0.95 and ar <= 1.05 else "rectangle"

        elif len(approx) == 5:
            shape = "pentagon"

        else:
            shape = "circle"

        return shape
