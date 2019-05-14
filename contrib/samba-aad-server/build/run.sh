#!/bin/bash
sed -i 's/%$(PAISMBUSER)/'$PAISMBUSER'/' /etc/samba/smb.conf
sed -i 's/%$(DOMAIN)/'$DOMAIN'/' /etc/samba/smb.conf

net ads join -U "$DOMAINUSER"%"$DOMAINPWD"
service winbind restart
service smbd restart

useradd "$PAISMBUSER"
(echo "$PAISMBPWD" && echo "$PAISMBPWD") | ./usr/bin/smbpasswd -a "$PAISMBUSER"

uwsgi --ini /infosrv/uwsgi.ini
service nginx stop
nginx -g 'daemon off;'
