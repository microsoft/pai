#coding=utf-8

from flask import Flask, render_template, request, redirect, send_from_directory

import json
import os
import requests
import cv2
import time
import matplotlib.image as mpimg
import numpy as np

import random

def getRandomStr(length = 8):
    seed = "1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
    return ''.join(random.sample(seed, 8))



app = Flask(__name__)

@app.route('/', methods=['GET'])
def index():
    context = {'imgPath': '../static/upload.png',
               'info': 'Click for select, only support English'
               }
    # context = {'imgPath': '../static/test_BlhnyHNR_result.jpeg'}
    return render_template('index.html', **context)


@app.route('/', methods=['POST'])
def uploadiamge():
    '''
    save a pic on py project from local pc
    :return:
    '''
    try:
        img = request.files['filechoose']
        base, ext = os.path.splitext(img.filename)
        base += time.strftime("_%Y%m%d%H%M%S_", time.localtime(time.time())) + getRandomStr(8)
        imgName = base + ext
        resultName = base + '_result' + ext
        imgPath = os.path.join('originImg', imgName)
        resultPath = os.path.join('resultImg', resultName)
        img.save(imgPath)
        results = useOcrApi(imgPath)
        drawResults(imgPath, resultPath, results)
        context = {'imgPath': '../'+resultPath}
        if len(results) != 0:
            context['info'] = 'Success'
        else:
            context['info'] = 'No words detected'
    except:
        context = {'imgPath': '../static/error.png',
                   'info': 'Service error'
                   }

    return render_template('index.html', **context)


@app.route('/resultImg/<string:filename>', methods=['GET'])
def download(filename):
    if request.method == "GET":
        if os.path.isfile(os.path.join('resultImg', filename)):
            return send_from_directory('resultImg', filename, as_attachment=True)
        pass




def getOcrUri():
    ocrUri = 'http://' + os.getenv('OCR_IP_PORT', '10.151.40.233:19242') + '/vision/v2.0/recognizeTextDirect'
    return ocrUri

def useOcrApi(imgPath):
    ocrUri = getOcrUri()
    filaname = os.path.basename(imgPath)
    _, ext = os.path.splitext(filaname)
    with open(imgPath, 'rb') as f:
        files = {'file': (filaname, f, 'image/' + ext.strip('.'))}
        try:
            res = requests.post(ocrUri, files=files, timeout=10)
        except requests.exceptions.Timeout:
            return {}
    return res.json()['lines']

def drawResults(imgPath, resultPath, results):
    im = mpimg.imread(imgPath)
    if im.shape[-1] == 4:
        im = np.array(im[:,:,:-1])
    lines = results

    for line in lines:
        box, text = line['boundingBox'], line['text']
        tl_x = min(box[0::2])
        tl_y = min(box[1::2])
        br_x = max(box[0::2])
        br_y = max(box[1::2])
        cv2.rectangle(im, (tl_x, tl_y), (br_x, br_y), (0, 255, 0), 3)
        cv2.putText(im, text, (tl_x, tl_y), cv2.FONT_HERSHEY_COMPLEX_SMALL, 0.8, (0, 0, 255))

    mpimg.imsave(resultPath, im)
    # cv2.imwrite(resultPath, im)

if __name__ == '__main__':
    host = '0.0.0.0'
    port = os.getenv('APP_LISTEN_PORT', 5000)
    debug = True
    app.run(host=host, port=port, debug=debug)