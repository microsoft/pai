#!/bin/sh

set -e

if [ -f /etc/docker/daemon.json ] ; then
    cat /etc/docker/daemon.json | jq 'del(."default-runtime")' | jq 'del(.runtimes.nvidia)' > tmp
    mv tmp /etc/docker/daemon.json
    pkill -SIGHUP dockerd
fi

touch /finished

while true; do sleep 3600; done
