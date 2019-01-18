#!/bin/sh

SSHD_BIN=/usr/sbin/sshd
CONFIG_DIR=/usr/local/pai/sshd

if [ -f /usr/sbin/sshd ] ; then
    if [ -z "$PAI_SSH_PUB_KEY" -o -z "$PAI_CONTAINER_SSH_PORT" ] ; then
        echo "no private key or port provided" >&2
    else
        mkdir -p $CONFIG_DIR

        mkdir /root/.ssh
        mkdir -p /var/run/sshd

        echo "$PAI_SSH_PUB_KEY" > /root/.ssh/authorized_keys
        chmod 600 /root/.ssh/authorized_keys

        echo "Port ${PAI_CONTAINER_SSH_PORT}" >> ${CONFIG_DIR}/config
        exec $SSHD_BIN -f ${CONFIG_DIR}/config
    fi
else
    echo "no sshd binary found" >&2
fi
