#!/bin/bash

# check nfs
# cannot use service nfs-kernel-server status directly
# because nfsd is running in host
ps -aux | grep -v grep | grep rpc.mountd &> /dev/null
nfsstatus=$?

# check smb
service smbd status $> /dev/null
smbstatus=$?

exit `expr $nfsstatus + $smbstatus`