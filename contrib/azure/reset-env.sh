#!/bin/bash

rm -rf _output/ .azure_quick_start/
docker kill dev-box
docker rm dev-box