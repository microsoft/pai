#!/usr/bin/env sh

MANIFESTS_DIR=/etc/kubernetes/manifests
ORIGIN=$MANIFESTS_DIR/etcd.yaml
UPGRADED_NAME=etcd-upgraded.yaml
TMP_DIR=/tmp

if [ -f "$ORIGIN" ] ; then
    cat $ORIGIN | /upgrade/upgrade.py > $TMP_DIR/$UPGRADED_NAME
    rtn=$?
    if [ $rtn -eq 0 ] ; then
        rm $ORIGIN
        sleep 10 # it seems k8s requires the yaml file disappear some time
        mv $TMP_DIR/$UPGRADED_NAME $MANIFESTS_DIR
        echo success
        touch /upgrade/done
    else
        echo failed, nothing changed, return code is $rtn >&2
    fi
else
    echo no etcd file found, nothing changed
    touch /upgrade/done
fi

sleep infinity
