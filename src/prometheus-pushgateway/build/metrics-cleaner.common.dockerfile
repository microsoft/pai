# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

FROM python:3.7

COPY ./src/metrics-cleaner .

RUN python -m pip install --upgrade pip && python -m pip install -r requirements.txt

ENTRYPOINT ["python3", "main.py"]
