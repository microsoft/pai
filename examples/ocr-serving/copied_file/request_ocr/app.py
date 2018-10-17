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

def getRandomStr(length = 8):
    seed = "1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
    return ''.join(random.sample(seed, 8))


app = Flask(__name__)


@app.route("/", methods=["GET"])
def index():
    context = {"imgPath": "../static/upload.png",
               "info": "Click for select, only support English"
               }
    # context = {'imgPath': '../static/test_BlhnyHNR_result.jpeg'}
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

        results = useOcrLocal(imgPath)
        drawResults(imgPath, resultPath, results)

        context = {"imgPath": "../" + resultPath}
        if len(results) != 0:
            context["info"] = "Success"
        else:
            context["info"] = "No words detected"
    except:
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
            ocrResult = api.GetUTF8Text()
            result = {"boundingBox": {"tl_x": box['x'],
                                      "tl_y": box['y'],
                                      "br_x": box['x'] + box['w'],
                                      "br_y": box['y'] + box['h']},
                      "text": ocrResult}
            results.append(result)
    return results


def getOcrUri():
    ocrUri = "http://" + os.getenv("OCR_IP_PORT", "10.151.40.233:19242") + "/vision/v2.0/recognizeTextDirect"
    return ocrUri


def useOcrApi(imgPath):
    ocrUri = getOcrUri()
    filename = os.path.basename(imgPath)
    _, ext = os.path.splitext(filename)
    with open(imgPath, "rb") as f:
        files = {"file": (filename, f, "image/" + ext.strip('.'))}
        try:
            res = requests.post(ocrUri, files=files, timeout=10)
        except requests.exceptions.Timeout:
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
    host = "0.0.0.0"
    port = os.getenv("APP_LISTEN_PORT", 5000)
    debug = True
    app.run(host=host, port=port, debug=debug)