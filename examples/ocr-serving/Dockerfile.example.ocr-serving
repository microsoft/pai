
FROM pai.build.base:hadoop2.7.2-cuda9.0-cudnn7-devel-ubuntu16.04 as base_build

COPY copied_file/ /root/

RUN DEBIAN_FRONTEND=noninteractive && \
    apt update && \
    apt install -y --no-install-recommends \
        python3 \
        python3-pip \
        tesseract-ocr \
        libtesseract-dev \
        libleptonica-dev && \
    apt clean

RUN pip3 --no-cache-dir install \
        flask \
        opencv-python \
        requests \
        matplotlib==2.2.2 \
        pillow \
        tesserocr \
        pyocr
    


WORKDIR /root/request_ocr

CMD ["python3", "app.py"]
