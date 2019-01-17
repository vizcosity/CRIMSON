# This module aims to resolve conflicts between the set of shapes which are
# detected during the first stage of the detection pipeline, using traditional
# image processing, binarisation, and contour detection techniques, with the
# set of predicted primitives which are returned from CNN classificationself.
#
# @ Aaron Baw 2018

def resolveShapesUsingPredictions(primtives, shapes):

    # For each primitive we detect using the CNN, match it up to a corresponding
    # shape we detected.
    for primitive in primitives:
        box, vertices, label, id, confidence = primitive
        
    pass
