#!/bin/bash
if [ -z "$5" ]; then
    echo "usage: ./start.sh <DOMAIN> <DOMAINUSER> <DOMAINPWD> <PAISMBUSER> <PAISMBPWD>"
else
    DOMAIN=$1
    DOMAINUSER=$2
    DOMAINPWD=$3
    PAISMBUSER=$4 
    PAISMBPWD=$5   

    mkdir -p /share/pai
    docker run -dit --privileged --restart=always -p 8079:80 -p 445:445 --mount type=bind,source=/share/pai,target=/share/pai \
    --name paismb -e DOMAIN="$DOMAIN" -e DOMAINUSER="$DOMAINUSER" -e DOMAINPWD="$DOMAINPWD" \
    -e PAISMBUSER="$PAISMBUSER" -e PAISMBPWD="$PAISMBPWD" paismb:stable
fi