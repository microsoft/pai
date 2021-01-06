#!/bin/bash
set -e

echo "pai" > cluster-id

echo "Pushing cluster config to k8s..." 
/mnt/pai/paictl.py config push -p /cluster-configuration -m service < cluster-id

echo "Starting OpenPAI service..."
/mnt/pai/paictl.py service start < cluster-id

rm cluster-id
