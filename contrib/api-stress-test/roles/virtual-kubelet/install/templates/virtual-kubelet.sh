#!/bin/bash

set -e

nodename_prefix="{{ansible_hostname}}"

chmod a+x /usr/bin/virtual-kubelet
/usr/bin/virtual-kubelet --provider mock --provider-config /etc/virtual-kubelet/vk-config.yml --enable-node-lease=true --node-number {{vk_per_host}} --nodename $nodename_prefix --kubeconfig /etc/virtual-kubelet/kubeconfig

