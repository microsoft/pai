#!/bin/bash

source ../.env
envsubst < ../conf/drbdha.res.template > ../conf/drbdha.res
envsubst < ./sendha.py.template > ./sendha.py
echo "Make dirs"
mkdir -p /etc/drbdha
mkdir -p /var/log/drbdha
echo "Copy Scripts"
cp ../scripts/* /etc/drbdha
chmod +x /etc/drbdha/*
echo "Copy DRBD Configs"
cp ../conf/drbdha.res /etc/drbd.d
cp ../conf/global_common.conf /etc/drbd.d
echo "Copy Services"
cp ../services/* /lib/systemd/system
echo "Reload services"
systemctl daemon-reload
