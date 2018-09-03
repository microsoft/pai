#!/bin/bash

set -x

DIR="$(cd "$( dirname "${BASH_SOURCE[0]}" )")"
export PYTHONPATH=$PYTHONPATH:$DIR

nose_args="--with-coverage \
    --cover-erase \
    --cover-html \
    --logging-level=DEBUG \
    -s \
    -v "

nosetests $nose_args
