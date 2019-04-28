# Detecting primitives through the use of the webcam demo.
#
import cv2
import sys
import math
import numpy as np
import yolo_cnn_detector

# cascPath = sys.argv[1]
# faceCascade = cv2.CascadeClassifier(cascPath)

video_capture = cv2.VideoCapture(0)


while True:
    # Capture frame-by-frame
    ret, frame = video_capture.read()

    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

    # Detect primitives in the image.
    primitives = yolo_cnn_detector.predict_primitives(frame, frame.shape)

    # Draw the primitives.
    for primitive in primitives:
        box, vertices, label, class_id, confidence = primitive
        x, y, w, h = box
        yolo_cnn_detector.draw_pred(frame, class_id, confidence, round(x), round(y), round(x+w), round(y+h))

    # faces = faceCascade.detectMultiScale(
    #     gray,
    #     scaleFactor=1.1,
    #     minNeighbors=5,
    #     minSize=(30, 30),
    #     flags=cv2.cv.CV_HAAR_SCALE_IMAGE
    # )

    # Draw a rectangle around the faces
    # x = np.random.randint(255)
    # y = np.random.randint(255)
    # w = np.random.randint(255)
    # h = np.random.randint(255)
    # cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)

    # Display the resulting frame
    cv2.imshow('Video', frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# When everything is done, release the capture
video_capture.release()
cv2.destroyAllWindows()
