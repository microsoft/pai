#!/bin/bash
set -e

echo "pai" > cluster-id

echo "Pushing cluster config to k8s..." 
/pai/paictl.py config push -p /cluster-configuration -m service < cluster-id

echo "Starting OpenPAI service..."
/pai/paictl.py service start < cluster-id

rm cluster-id
