import requests
from PIL import Image
from tesserocr import PyTessBaseAPI, RIL
import pyocr
import pyocr.builders
import os
import logging

logger = logging.getLogger(__name__)


def getOcrMethod(methodName):
    if methodName == "tesserocr":
        return useOcrTesserocr
    elif methodName == "pyocr":
        return useOcrPyocr
    elif methodName == "api":
        return useOcrApi
    else:
        logger.error("invalid methodName: {}".format(methodName))
        return None


def useOcrTesserocr(imgPath):
    image = Image.open(imgPath)
    results = []
    with PyTessBaseAPI() as api:
        api.SetImage(image)
        boxes = api.GetComponentImages(RIL.TEXTLINE, True)
        for i, (im, box, _, _) in enumerate(boxes):
            api.SetRectangle(box['x'], box['y'], box['w'], box['h'])
            ocrResult = api.GetUTF8Text().strip()
            if ocrResult != "":
                logger.debug(("image path: {imgPath}, "
                                  "Box[{0}]: x={x}, y={y}, w={w}, h={h}, "
                                  "text: {1}").format(i, ocrResult, imgPath=imgPath, **box))
                result = {"boundingBox": {"tl_x": box['x'],
                                          "tl_y": box['y'],
                                          "br_x": box['x'] + box['w'],
                                          "br_y": box['y'] + box['h']},
                          "text": ocrResult}
                results.append(result)
    return results


def useOcrPyocr(imgPath):
    tools = pyocr.get_available_tools()
    if len(tools) == 0:
        logger.error("No available ocr library")
        return []
    tool = tools[0]

    image = Image.open(imgPath)
    line_and_word_boxes = tool.image_to_string(
        image,
        lang="eng",
        builder=pyocr.builders.LineBoxBuilder()
    )
    results = []
    for line in line_and_word_boxes:
        box, text = line.position, line.content.strip()
        if text != "":
            tl_x, tl_y = box[0]
            br_x, br_y = box[1]
            logger.debug(("image path: {imgPath}, "
                              "Box: x={x}, y={y}, w={w}, h={h}, "
                              "text: {text}").format(imgPath=imgPath, x=tl_x, y=tl_y, w=br_x-tl_x, h=br_y-tl_y, text=text))
            result = {"boundingBox": {"tl_x": tl_x,
                                      "tl_y": tl_y,
                                      "br_x": br_x,
                                      "br_y": br_y},
                      "text": text}
            results.append(result)
    return results


def getOcrUri():
    # For microsoft cognitive-services
    ocrUri = os.getenv("OCR_URI", None)
    if ocrUri is not None:
        return ocrUri
    else:
        # For internal version
        ocrIpport = os.getenv("OCR_IP_PORT", None)
        return "http://" + ocrIpport + "/vision/v2.0/recognizeTextDirect" if ocrIpport else None


def useOcrApi(imgPath, timeout=10):
    ocrUri = getOcrUri()
    if ocrUri is None:
        logger.error("Can't get API address, please pass it by env OCR_URI or OCR_IP_PORT")
        return []
    filename = os.path.basename(imgPath)
    _, ext = os.path.splitext(filename)
    with open(imgPath, "rb") as f:
        files = {"file": (filename, f, "image/" + ext.strip('.'))}
        try:
            res = requests.post(ocrUri, files=files, timeout=timeout)
        except requests.exceptions.Timeout:
            logger.error("API request timeout.")
            return []

    ocrResponse = res.json()
    if "status" in ocrResponse:
        if ocrResponse["status"] == "Succeeded":
            ocrResponse = ocrResponse["recognitionResult"]
        else:
            logger.error("Remote API return failure")
            return []

    results = []
    for line in ocrResponse["lines"]:
        box, text = line["boundingBox"], line["text"]
        tl_x = min(box[0::2])
        tl_y = min(box[1::2])
        br_x = max(box[0::2])
        br_y = max(box[1::2])
        result = {"boundingBox": {"tl_x": tl_x,
                                  "tl_y": tl_y,
                                  "br_x": br_x,
                                  "br_y": br_y},
                  "text": text}
        results.append(result)

    return results
