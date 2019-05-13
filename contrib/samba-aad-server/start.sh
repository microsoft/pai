#!/bin/bash
if [ -z "$2" ]; then
    echo "usage: ./start.sh DOMAINUSER DOMAINPASSWD"
else
    mkdir -p /share/pai
    docker run -dit --privileged --restart=always -p 8079:80 -p 445:445 --mount type=bind,source=/share/pai,target=/share/pai --name paismb -e DOMAINUSER="$1" -e DOMAINPASSWD="$2" paismb:0.1.0
fi