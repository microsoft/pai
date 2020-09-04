# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

FROM python:3.7-alpine

WORKDIR /usr/src/app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY src/ .

CMD ["python", "./adapter.py"]
