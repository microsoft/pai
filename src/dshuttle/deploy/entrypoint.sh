#!/bin/bash

while true; do
  ls /alluxio-fuse 2>&1 > /dev/null
  ret=$?
  if [[ "$ret" = 2 ]]; then
    echo "Umount fuse"
    fusermount -u /alluxio-fuse
    sleep 5
  fi
done
