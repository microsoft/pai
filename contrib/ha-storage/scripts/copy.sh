#!/bin/bash

source ../.env
envsubst < ../conf/drbdha.res.template > ../conf/drbdha.res
if [ -n "$SMTP_HOST" ] && [ -n "$SMTP_PORT" ] && [ -n "$SMTP_USER" ] && [ -n "$SMTP_PASS" ] && [ -n "$SMTP_RECIPIENT" ]; then 
  envsubst < ./sendha.py.template > ./sendha.py
else
  echo "Skip configuring emails"
fi
echo "Make dirs"
mkdir -p /etc/drbdha
mkdir -p /var/log/drbdha
mkdir -p /data/share/drbdha
echo "Copy Scripts"
cp ../scripts/* /etc/drbdha
chmod +x /etc/drbdha/*
cp ../.env /etc/drbdha
echo "Copy DRBD Configs"
cp ../conf/drbdha.res /etc/drbd.d/
cp ../conf/global_common.conf /etc/drbd.d/
echo "Copy Services"
cp ../services/* /lib/systemd/system
echo "Reload services"
systemctl daemon-reload
