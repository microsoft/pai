FROM python:2.7-alpine3.8

WORKDIR /pai-rest-server

RUN pip install flask-restful requests flask-cors

COPY src/rest.py /pai-rest-server
