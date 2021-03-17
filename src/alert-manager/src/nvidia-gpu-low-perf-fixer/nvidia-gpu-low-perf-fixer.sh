#!/bin/bash
set -e

echo "MINOR_NUMBER: ${MINOR_NUMBER}"

sudo nvidia-smi -pm ENABLED -i ${MINOR_NUMBER}

MAX_MEMORY_CLOCK=$(nvidia-smi -q -d SUPPORTED_CLOCKS | grep Memory | awk -v max=0 '{if($3>max){max=$3}}END{print max}')
MAX_GRAPHICS_CLOCK=$(nvidia-smi -q -d SUPPORTED_CLOCKS | grep Graphics | awk -v max=0 '{if($3>max){max=$3}}END{print max}')
echo "MAX_MEMORY_CLOCK: ${MAX_MEMORY_CLOCK}, MAX_GRAPHICS_CLOCK: ${MAX_GRAPHICS_CLOCK}"

sudo nvidia-smi -ac ${MAX_MEMORY_CLOCK},${MAX_GRAPHICS_CLOCK} -i ${MINOR_NUMBER}
