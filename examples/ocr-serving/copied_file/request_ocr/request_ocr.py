import requests
import cv2
import json



ocrUri = 'http://10.151.40.233:19242/vision/v2.0/recognizeTextDirect'
img = r'C:\Users\zimiao\Desktop\Capture.PNG'

im = cv2.imread(img)

files = {'file': ('ocr2.jpg', open(img, 'rb'), 'image/png')}


res = requests.post(ocrUri, files=files)

print(res.json(), res.status_code)

lines = res.json()['lines']

boxNum = len(lines)

for line in lines:
    box, text = line['boundingBox'], line['text']
    tl_x = min(box[0::2])
    tl_y = min(box[1::2])
    br_x = max(box[0::2])
    br_y = max(box[1::2])
    cv2.rectangle(im, (tl_x, tl_y), (br_x, br_y), (0, 255, 0), 3)
    cv2.putText(im, text, (tl_x, tl_y), cv2.FONT_HERSHEY_COMPLEX_SMALL, 0.8, (0, 0, 255))

cv2.imwrite('test.png', im)







# print(res.text, res.status_code)

