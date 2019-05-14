#!/bin/bash
if [ -z "$5" ]; then
    echo "usage: ./start.sh <DOMAIN> <DOMAINUSER> <DOMAINPWD> <PAISMBUSER> <PAISMBPWD>"
else
    #TODO: check domain
    echo 'EUROPE FAREAST NORTHAMERICA MIDDLEEAST REDMOND SOUTHAMERICA SOUTHPACIFIC AFRICA' | grep -qw "$1"
    if [ $? -eq 0]; then
        mkdir -p /share/pai
        docker run -dit --privileged --restart=always -p 8079:80 -p 445:445 --mount type=bind,source=/share/pai,target=/share/pai --name paismb -e DOMAIN="$1" -e DOMAINUSER="$2" -e DOMAINPWD="$3" -e PAISMBUSER="$4" -e PAISMBPWD="$5" paismb:stable
    else
        echo "<DOMAIN> should be EUROPE|FAREAST|NORTHAMERICA|MIDDLEEAST|REDMOND|SOUTHAMERICA|SOUTHPACIFIC|AFRICA"
    fi   
fi