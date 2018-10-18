#coding=utf-8

from flask import Flask, render_template, request, redirect, send_from_directory

import json
import os
import requests
import cv2
import time
import matplotlib.image as mpimg
from PIL import Image
import numpy as np
from tesserocr import PyTessBaseAPI, RIL
import random
import logging
import argparse
import pyocr
import pyocr.builders


def getRandomStr(length = 8):
    seed = "1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
    return ''.join(random.sample(seed, 8))


app = Flask(__name__)


def setLoggerFormat(logFile="flask.log", logLevel="INFO"):

    fh = logging.FileHandler(logFile, 'w')
    fh.setLevel(logLevel)

    formatter = logging.Formatter('[%(asctime)s] %(name)s:%(levelname)s: %(message)s')
    fh.setFormatter(formatter)

    app.logger.addHandler(fh)
    app.logger.setLevel(logLevel)


@app.route("/", methods=["GET"])
def index():
    context = {"imgPath": "../static/upload.png",
               "info": "Click for select, only support English"
               }
    return render_template("index.html", **context)


@app.route("/", methods=["POST"])
def uploadimage():
    try:
        img = request.files["filechoose"]
        base, ext = os.path.splitext(img.filename)
        base += time.strftime("_%Y%m%d%H%M%S_", time.localtime(time.time())) + getRandomStr(8)
        imgName = base + ext
        resultName = base + "_result" + ext
        imgPath = os.path.join("originImg", imgName)
        resultPath = os.path.join("resultImg", resultName)
        img.save(imgPath)
        
        app.logger.info("start detect image: {}".format(imgPath))
        results = useOcrLocal2(imgPath)
        drawResults(imgPath, resultPath, results)

        context = {"imgPath": "../" + resultPath}
        if len(results) != 0:
            context["info"] = "Success"
        else:
            context["info"] = "No words detected"
    except Exception as e:
        app.logger.exception(e)
        context = {"imgPath": "../static/error.png",
                   "info": "Service error"
                   }

    return render_template("index.html", **context)


@app.route("/resultImg/<string:filename>", methods=["GET"])
def download(filename):
    if request.method == "GET" and os.path.isfile(os.path.join("resultImg", filename)):
        return send_from_directory("resultImg", filename, as_attachment=True)
    return None


def useOcrLocal(imgPath):
    image = Image.open(imgPath)
    results = []
    with PyTessBaseAPI() as api:
        api.SetImage(image)
        boxes = api.GetComponentImages(RIL.TEXTLINE, True)
        for i, (im, box, _, _) in enumerate(boxes):
            api.SetRectangle(box['x'], box['y'], box['w'], box['h'])
            ocrResult = api.GetUTF8Text().strip()
            if ocrResult != "":
                app.logger.debug(("image path: {imgPath}, "
                                  "Box[{0}]: x={x}, y={y}, w={w}, h={h}, "
                                  "text: {1}").format(i, ocrResult, imgPath=imgPath, **box))
                result = {"boundingBox": {"tl_x": box['x'],
                                          "tl_y": box['y'],
                                          "br_x": box['x'] + box['w'],
                                          "br_y": box['y'] + box['h']},
                          "text": ocrResult}
                results.append(result)
    return results

def useOcrLocal2(imgPath):
    tools = pyocr.get_available_tools()
    if len(tools) == 0:
        app.logger.warn("No available ocr library")
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
            app.logger.debug(("image path: {imgPath}, "
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
    ocrIpport = os.getenv("OCR_IP_PORT", None)
    return "http://" + ocrIpport + "/vision/v2.0/recognizeTextDirect" if ocrIpport else None


def useOcrApi(imgPath, timeout=10):
    ocrUri = getOcrUri()
    if ocrUri is None:
        app.logger.warn("Can't get API address, please pass it by env OCR_IP_PORT")
        return []
    filename = os.path.basename(imgPath)
    _, ext = os.path.splitext(filename)
    with open(imgPath, "rb") as f:
        files = {"file": (filename, f, "image/" + ext.strip('.'))}
        try:
            res = requests.post(ocrUri, files=files, timeout=timeout)
        except requests.exceptions.Timeout:
            app.logger.warn("API request timeout.")
            return []

    results = []
    for line in res.json()["lines"]:
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


if __name__ == "__main__":

    parser = argparse.ArgumentParser()

    parser.add_argument("-p", "--port", dest="port", default=5000, help="Listen port, default is 5000")
    parser.add_argument("--debug", dest="debug", required=False, action="store_true", default=False, help="Open debug mode")

    args = parser.parse_args()

    host = "0.0.0.0"
    port = args.port
    debug = args.debug

    setLoggerFormat(logLevel="DEBUG" if args.debug else "INFO")
    app.logger.info("start ocr service")
    app.run(host=host, port=port, debug=debug)
