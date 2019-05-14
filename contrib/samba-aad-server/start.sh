#!/bin/bash
if [ -z "$4" ]; then
    echo "usage: ./start.sh DOMAINUSER DOMAINPWD PAISMBUSER PAISMBPWD"
else
    mkdir -p /share/pai
    docker run -dit --privileged --restart=always -p 8079:80 -p 445:445 --mount type=bind,source=/share/pai,target=/share/pai --name paismb -e DOMAINUSER="$1" -e DOMAINPWD="$2" -e PAISMBUSER="$3" -e PAISMBPWD="$4" paismb:stable
fi