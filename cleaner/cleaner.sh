#!/bin/bash

if [ "$1" == "test" ]; then
    python -m unit_test cleaner.test.utils_test
fi