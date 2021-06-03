# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

FROM python:3.7

COPY ./src/cluster-utilization .

RUN pip3 install -r requirements.txt

ENTRYPOINT ["python3", "send_alert.py"]
