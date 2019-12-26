#!/bin/bash

while getopts "w:m:c:" opt; do

  case $opt in

    \?)
      echo "Invalid option: -$OPTARG" >&2
      ;;


done