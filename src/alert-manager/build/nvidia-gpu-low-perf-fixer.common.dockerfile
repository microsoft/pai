# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

FROM nvidia/cuda:9.2-base-ubuntu16.04

COPY ./src/nvidia-gpu-low-perf-fixer .

ENTRYPOINT /bin/bash nvidia-gpu-low-perf-fixer.sh
