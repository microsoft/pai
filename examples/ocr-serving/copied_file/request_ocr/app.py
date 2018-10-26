#coding=utf-8

import os
import time
import random
import logging
import argparse
from flask import Flask, render_template, request, redirect, send_from_directory

from ocrLibrary.OcrHandle import getOcrMethod
from ocrLibrary.Imgtools import drawResults


def getRandomStr(length=8):
    seed = "1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
    return ''.join(random.sample(seed, length))


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
        results = getOcrResult(imgPath)
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
    if os.path.isfile(os.path.join("resultImg", filename)):
        return send_from_directory("resultImg", filename, as_attachment=True)
    else:
        app.logger.warn("File doesn't exist: {}".format(filename))
        return None


if __name__ == "__main__":

    parser = argparse.ArgumentParser()

    parser.add_argument("-p", "--port", dest="port", default=5000, help="Listen port, default is 5000")
    parser.add_argument("-m", "--method", dest="method", default="pyocr",
                        help="Ocr method, choose from [tesserocr, pyocr, api], default is pyocr")
    parser.add_argument("--debug", dest="debug", required=False, action="store_true", default=False, help="Open debug mode")

    args = parser.parse_args()

    host = "0.0.0.0"
    port = args.port
    debug = args.debug
    getOcrResult = getOcrMethod(args.method)
    if getOcrResult is None:
        exit(1)

    setLoggerFormat(logLevel="DEBUG" if args.debug else "INFO")
    app.logger.info("start ocr service")
    app.run(host=host, port=port, debug=debug)
