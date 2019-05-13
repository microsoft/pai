#!/bin/bash
net ads join -U "$DOMAINUSER"%"$DOMAINPASSWD"
service winbind restart
service smbd restart

useradd "$PAISMBUSER"
(echo "$PAISMBPWD" && echo "$PAISMBPWD") | ./usr/bin/smbpasswd -a "$PAISMBUSER"

uwsgi --ini /infosrv/uwsgi.ini
service nginx stop
nginx -g 'daemon off;'
