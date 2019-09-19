#!/bin/bash

# copy krb5.conf
if [ -f "/etc/pai-config/krb5.conf" ]; then
  cp /etc/pai-config/krb5.conf /etc/krb5.conf
fi

if [ -f "/etc/pai-config/smb.conf" ]; then
  cp /etc/pai-config/smb.conf /etc/samba/smb.conf
fi

# create folders
mkdir -p $SHARE_ROOT/data
mkdir -p $SHARE_ROOT/users

# load nfs modules
modprobe nfs
modprobe nfsd

# join domain
if [[ $DOMAIN != "WORKGROUP" ]]; then 
  net ads join -U "$DOMAINUSER"%"$DOMAINPWD"
fi

# restart service
service winbind restart
service smbd restart
service rpcbind restart
service nfs-kernel-server restart

useradd "$PAISMBUSER"
(echo "$PAISMBPWD" && echo "$PAISMBPWD") | ./usr/bin/smbpasswd -a "$PAISMBUSER"

sleep infinity
