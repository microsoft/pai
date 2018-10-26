import cv2
import matplotlib.image as mpimg
import numpy as np
import logging

logger = logging.getLogger(__name__)

def drawResults(imgPath, resultPath, results):

    im = mpimg.imread(imgPath)

    # For 4 channel image, discard the last channel.
    if im.shape[-1] == 4:
        im = np.array(im[..., :-1])

    for line in results:
        box, text = line["boundingBox"], line["text"]
        tl_x, tl_y, br_x, br_y = box["tl_x"], box["tl_y"], box["br_x"], box["br_y"]

        cv2.rectangle(im, (tl_x, tl_y), (br_x, br_y), (0, 255, 0), 3)
        cv2.putText(im, text, (tl_x, tl_y), cv2.FONT_HERSHEY_COMPLEX_SMALL, 0.8, (0, 0, 255))

    mpimg.imsave(resultPath, im)