resource drbdha {
  device /dev/drbd0;
  disk /dev/sdb1;
  meta-disk internal;
  on paigcr-a-gpu-1107 {
    address 10.151.41.13:7789;
  }
  on paigcr-a-gpu-1108 {
    address 10.151.41.14:7789;
  }
}
