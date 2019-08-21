# HA Storage

## 1. Overview
HA Storage is a lightweight highly-available storage solution with DRBD, which has the following advantages:
  
  - Easy to setup (for non-professional users);
  - Easy to maintain (for non-professional users);
  - Fast recovery (ability to recover storage fast when an error occurs);
  - Data integrity (ensure that data is not lost when an error occurs);
  - Independent of hardware, such as RAID;
  - Support multiple sharing methods, such as NFS and SMB.

Tested OS:
  - Ubuntu 16.04 LTS
  - Ubuntu 18.04 LTS

***NOTICE: This is still an experiment solution and may be changed in future release***

## 2. Directory Structure

```
ha-storage
├── README.md
├── .env.template                        # env file
├── DRBD                                 # DRBD conf files
│   ├── drbdha.res.template
│   └── global_common.conf
├── others                               # An automatic failover demo (not recommended)
│   ├── keepalived                       # Keepalived conf files
│   │   ├── BACKUP
│   │   │   └── keepalived.conf.template
│   │   └── MASTER
│   │       └── keepalived.conf.template
│   └── scripts                          # Keepalived maintenance scripts
│       ├── checkservices.sh
│       ├── notify.sh
│       └── sendemail.py.template
├── scripts                              # Maintenance scripts
│   ├── chkha.sh                         # Check DRBD, NFS and SMB status
│   ├── copy.sh                          # Copy conf files and scripts to specific folders
│   ├── maintain.sh                      # Switch host role (MASTER or BACKUP)
│   └── sendha.py.template               # Send warning emails
└── services                             # Systemd service conf files
    ├── chkha.service                    # Status check service
    └── chkha.timer                      # Timer of chkha.service
```

## 3. Deployment

### 3.1 Useful Info

  - Default log path: ```/var/log/drbdha/actions.log```
  - Default service path: ```/lib/systemd/system/```
  - Default mount path: ```/data/share/drbdha/```
  - DRBD conf path: ```/etc/drbd.d```

  You can change these paths in the constants section of scripts.

### 3.2 Prepare

In this sub-section, you will copy conf files, scripts, and services to specific folders. Please modify the ```.env.template``` first and rename it to ```.env```.

```sh
export DISK=""             # Disk name such as "/dev/sda1"
export MASTER_HOSTNAME=""  # Master (primary DRBD host) hostname
export MASTER_IP=""        # Master host ip
export BACKUP_HOSTNAME=""  # Backup (secondary DRBD host) hostname
export BACKUP_IP=""        # Backup host ip
```

```sh
# These vars are optional
# If these vars are not set, no email will be sent
export SMTP_HOST=""        # smtp host to send emails
export SMTP_PORT=""        # smtp host port
export SMTP_USER=""        # smtp host user
export SMTP_PASS=""        # smtp host password
export SMTP_RECIPIENT=""   # Who receives the email
```

```sh
# copy files
# This step will copy conf files, scripts and services to specific folder
git clone https://github.com/microsoft/pai.git
cd pai/contrib/ha-storage/scripts
chmod +x copy.sh
./copy.sh
```

### 3.3 Setup DRBD

In this sub-section, you will set up DRBD and mount DRBD loop device. You should prepare an empty disk first.

If you have any doubts, please refer to the [DRBD official user's guide](https://docs.linbit.com/docs/users-guide-8.4/).

```sh
# Suppose you are root
# Install DRBD 8.4
apt install drbd-utils drbd-doc
modprobe drbd
lsmod | grep drbd
# Prepare low-level disk
# Suppose /dev/sdd is your empty disk
# Double-check the disk to be operated!!
fdisk -l
fdisk /dev/sdd
g
n
w
fdisk -l
partprobe /dev/sdd
# Configure DRBD
cd /etc/drbd.d
# Edit global_common.conf if you want
# Edit drbdha.res if you want
# Start DRBD
drbdadm create-md drbdha
# Exec the following commands only on the master host
drbdadm primary --force drbdha
# Format
mkfs.ext4 /dev/drbd0 -E nodiscard
# Mount DRBD device
mount /dev/drbd0 /data/share/drbdha
```

### 3.3 Setup NFS and SMB

Please config NFS and SMB by yourself and set the shared folder to ```/data/share/drbdha/```.

### 3.4 Check status

You can check DRBD status by running:

```sh
cat /proc/drbd
```

You can also check NFS, SMB, and DRBD status by running:

```sh
# This shell will check NFS, SMB, and DRBD status and write to actions.log
# Please modify the func named checkNFS and checkSMB as it may be different from your environment.
/etc/drbdha/chkha.sh
cat /var/log/actions.log
```
### 3.4 Run Monitor Service

If everything runs smoothly, you can change the MASTER host into MASTER role.

```sh
# Please modify the SMTP info in sendha.py
# Please modify the func named startNFS, stopNFS, startSMB, and stopSMB as it may be different from your environment.
# Change to BACKUP role first since there may be some conflicts
/etc/drbdha/maintain.sh BACKUP
/etc/drbdha/maintain.sh MASTER
# You will receive two emails if you configure the SMTP correctly.
# Run monitor service
# Please only run this service on the MASTER host.
systemctl start chkha.timer
systemctl status chkha.timer
# If you wang this service run automatically after reboot
systemctl enable chkha.timer
# You can check all status from actions.log
cat /var/log/actions.log
```

## License

    MIT License

    Copyright (c) Microsoft Corporation. All rights reserved.

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE