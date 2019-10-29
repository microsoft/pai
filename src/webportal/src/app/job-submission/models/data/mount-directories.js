import { isNil, isEmpty } from 'lodash';

import { InputData } from './input-data';
import {
  TEAMWISE_DATA_CMD_START,
  TEAMWISE_DATA_CMD_END,
  AUTO_GENERATE_NOTIFY,
} from '../../utils/constants';

export class MountDirectories {
  constructor(user, jobName, selectedConfigs, servers) {
    this.user = user;
    this.jobName = jobName;
    this.selectedConfigs = selectedConfigs || [];
    this.servers = servers || [];
  }

  getPaiCommand() {
    if (isEmpty(this.selectedConfigs)) {
      return [];
    }

    const returnValue = [
      TEAMWISE_DATA_CMD_START,
      AUTO_GENERATE_NOTIFY,
      'apt-get update',
      'umask 000',
    ];

    const serverMountDict = {};

    for (const config of this.selectedConfigs) {
      if (config.mountInfos !== undefined) {
        for (const mountInfo of config.mountInfos) {
          if (mountInfo.server in serverMountDict) {
            serverMountDict[mountInfo.server].push(mountInfo);
          } else {
            serverMountDict[mountInfo.server] = [mountInfo];
          }
        }
      }
    }

    const mountPoints = [];

    for (const spn in serverMountDict) {
      if (!isNil(serverMountDict[spn])) {
        const mountInfos = serverMountDict[spn];
        const server = this.servers.find(item => item.spn === spn);

        if (server !== undefined) {
          const tmpFolder = `/tmp_${spn}_root/`;

          const preCmds = this.generatePreMountCmds(server, tmpFolder);
          if (preCmds !== undefined) {
            for (const preCmd of preCmds) {
              returnValue.push(preCmd);
            }
          }

          // Step1: Mount root folder and make sub directories
          const mountStrs = this.generateMountCmds(
            server,
            tmpFolder,
            '',
            tmpFolder,
          );
          if (mountStrs !== undefined) {
            for (const mountStr of mountStrs) {
              returnValue.push(mountStr);
            }
          }

          for (const mountInfo of mountInfos) {
            // Check duplicated mount points
            if (mountPoints.includes(mountInfo.mountPoint)) {
              throw new Error(
                'Mount point error! More than one mount point [' +
                  mountInfo.mountPoint +
                  ']!',
              );
            } else {
              mountPoints.push(mountInfo.mountPoint);
            }

            // Create folder on server root path
            returnValue.push(`mkdir --parents ${mountInfo.mountPoint}`);
            returnValue.push(
              `mkdir --parents ${this.normalizePath(
                tmpFolder + mountInfo.path,
              )}`,
            );
          }

          const postCmds = this.generatePostMountCmds(server, tmpFolder);
          if (postCmds !== undefined) {
            for (const postCmd of postCmds) {
              returnValue.push(postCmd);
            }
          }

          // Step2: Mount folder for mount infos
          for (const mountInfo of mountInfos) {
            // Mount
            const mountSubStrs = this.generateMountCmds(
              server,
              mountInfo.mountPoint,
              mountInfo.path,
              tmpFolder,
            );
            if (mountSubStrs !== undefined) {
              for (const mountStr of mountSubStrs) {
                returnValue.push(mountStr);
              }
            }
          }
        }
      }
    }
    returnValue.push(TEAMWISE_DATA_CMD_END);
    return returnValue;
  }

  applyJSON({ selectedConfigs, servers }) {
    Object.assign(this, { selectedConfigs, servers });
  }

  toJSON() {
    const { selectedConfigs, servers } = this;
    return { selectedConfigs, servers };
  }

  generatePreMountCmds(serverData, tmpFolder) {
    const serverType = serverData.type;
    let returnValue;

    switch (serverType) {
      case 'nfs':
        returnValue = [
          `mkdir --parents ${tmpFolder}`,
          'apt-get install --assume-yes nfs-common',
        ];
        break;
      case 'samba':
        returnValue = [
          `mkdir --parents ${tmpFolder}`,
          'apt-get install --assume-yes cifs-utils',
        ];
        break;
      case 'azurefile':
        returnValue = [
          `mkdir --parents ${tmpFolder}`,
          'apt-get install --assume-yes cifs-utils',
        ];
        if (serverData.proxy !== undefined && serverData.proxy.length === 2) {
          returnValue.push('apt-get install --assume-yes sshpass');
          const proxyInfo = serverData.proxy[0];
          const proxyPassword = serverData.proxy[1];
          const proxyIp =
            proxyInfo.indexOf('@') === -1
              ? proxyInfo
              : proxyInfo.substring(proxyInfo.indexOf('@') + 1);
          returnValue.push(`mkdir --parents ~/.ssh`);
          returnValue.push(`ssh-keyscan ${proxyIp} >> ~/.ssh/known_hosts`);
          returnValue.push(
            `sshpass -p '${proxyPassword}'` +
              ` ssh -N -f -L 445:${serverData.dataStore}:445 ${proxyInfo}`,
          );
        }
        break;
      case 'azureblob': {
        const tmpPath = `/mnt/resource/blobfusetmp/${serverData.spn}`;
        const cfgFile = `/${serverData.spn}.cfg`;
        returnValue = [
          'apt-get install --assume-yes wget curl lsb-release apt-transport-https',
          "valid_release=('14.04' '15.10' '16.04' '16.10' '17.04' '17.10' '18.04' '18.10' '19.04')",
          'release=`lsb_release -r | cut -f 2`',
          'if [[ ! ${valid_release[@]} =~ ${release} ]]; then echo "Invalid OS version for Azureblob!"; exit 1; fi', // eslint-disable-line no-template-curly-in-string
          'wget https://packages.microsoft.com/config/ubuntu/${release}/packages-microsoft-prod.deb', // eslint-disable-line no-template-curly-in-string
          'dpkg -i packages-microsoft-prod.deb',
          'apt-get update',
          'apt-get install --assume-yes blobfuse fuse', // blob to mount and fuse to unmount
          `mkdir --parents ${tmpPath}`,
          // Generate mount point
          `echo "accountName ${serverData.accountName}" >> ${cfgFile}`,
          `echo "accountKey ${serverData.key}" >> ${cfgFile}`,
          `echo "containerName ${serverData.containerName}" >> ${cfgFile}`,
          `chmod 600 ${cfgFile}`,
          `mkdir --parents ${tmpFolder}`,
        ];
        break;
      }
      case 'hdfs':
        returnValue = [
          'apt-get install -y git fuse golang',
          'git clone --recursive https://github.com/Microsoft/hdfs-mount.git',
          'cd hdfs-mount',
          'make',
          'cp hdfs-mount /bin',
          'cd ..',
          'rm -rf hdfs-mount',
          `mkdir --parents ${tmpFolder}`,
        ];
        break;
      default:
        break;
    }
    return returnValue;
  }

  generatePostMountCmds(serverData, tmpFolder) {
    let returnValue;
    const serverType = serverData.type;
    switch (serverType) {
      case 'nfs':
      case 'samba':
      case 'azurefile':
        // umount server root path
        returnValue = [`umount -l ${tmpFolder}`, `rm -r ${tmpFolder}`];
        break;
      case 'azureblob':
        // Use ln for azure blob, does not mount folder separately
        // Can use 'fusermount -u </path/to/mountpoint>' to unmount. fusermount is from fuse package
        break;
      case 'hdfs':
        break;
    }
    return returnValue;
  }

  // tslint:disable-next-line:max-line-length
  generateMountCmds(serverData, mountPoint, relativePath, tmpFolder) {
    const serverType = serverData.type;
    switch (serverType) {
      case 'nfs':
        return [
          `mount -t nfs4 ${serverData.address}:${this.normalizePath(
            serverData.rootPath + '/' + relativePath,
          )} ${mountPoint}`,
        ];
      case 'samba':
        return [
          `mount -t cifs //${serverData.address}${this.normalizePath(
            '/' + serverData.rootPath + '/' + relativePath,
          )} ${mountPoint} -o vers=3.0,username=${
            serverData.userName
          },password=${serverData.password}` +
            (serverData.domain !== undefined && serverData.domain.length > 0
              ? `,domain=${serverData.domain}`
              : ''),
        ];
      case 'azurefile':
        if (serverData.proxy !== undefined) {
          return [
            `mount -t cifs //localhost/${this.normalizePath(
              serverData.fileShare + '/' + relativePath,
            )} ${mountPoint} -o vers=3.0,username=${
              serverData.accountName
            },password=${
              serverData.key
            },dir_mode=0777,file_mode=0777,serverino`,
          ];
        } else {
          return [
            `mount -t cifs //${serverData.dataStore}/${this.normalizePath(
              serverData.fileShare + '/' + relativePath,
            )} ${mountPoint} -o vers=3.0,username=${
              serverData.accountName
            },password=${
              serverData.key
            },dir_mode=0777,file_mode=0777,serverino`,
          ];
        }
      case 'azureblob':
      case 'hdfs':
        if (mountPoint === tmpFolder) {
          if (serverType === 'azureblob') {
            // Mount azureblob endpoint
            const tmpPath = `/mnt/resource/blobfusetmp/${serverData.spn}`;
            const cfgFile = `/${serverData.spn}.cfg`;
            return [
              `blobfuse ${tmpFolder} --tmp-path=${tmpPath} --config-file=${cfgFile} -o attr_timeout=240 ` +
                `-o entry_timeout=240 -o negative_timeout=120`,
            ];
          } else if (serverType === 'hdfs') {
            return [
              `(hdfs-mount ${serverData.namenode}:${serverData.port} ${mountPoint} &)`,
              // sleep to wait until mount
              'sleep 3',
            ];
          }
        } else {
          // ln azureblob sub folder
          return [
            // remove mountPoint folder first. Otherwise will create soft link under mountPoint
            `rm -r ${mountPoint}`,
            `ln -s ${this.normalizePath(
              tmpFolder + relativePath,
            )} ${mountPoint}`,
          ];
        }
        break;
      default:
        return undefined;
    }
  }

  normalizePath(oriPath) {
    return oriPath
      .replace(/%USER/gi, this.user)
      .replace(/%JOB/gi, this.jobName)
      .replace('//', '/');
  }

  getServerPath(serverName) {
    let returnValue = '';

    const server = this.servers.find(srv => srv.spn === serverName);
    if (server !== undefined) {
      switch (server.type) {
        case 'nfs':
          returnValue = 'nfs://' + server.address + ':' + server.rootPath;
          break;
        case 'samba':
          returnValue = 'smb://' + server.address + '/' + server.rootPath;
          break;
        case 'azurefile':
          returnValue =
            'azurefile://' + server.dataStore + '/' + server.fileShare;
          break;
        case 'azureblob':
          returnValue =
            'azureblob://' + server.dataStore + '/' + server.containerName;
          break;
        case 'hdfs':
          returnValue = 'hdfs://' + server.namenode + ':' + server.port;
          break;
      }
    }
    return returnValue;
  }

  getTeamDataList() {
    const newTeamDataList = [];
    for (const config of this.selectedConfigs) {
      for (const mountInfo of config.mountInfos) {
        const serverRootPath = this.getServerPath(mountInfo.server);
        const serverPath =
          serverRootPath +
          this.normalizePath(
            serverRootPath.endsWith('/') ? '' : '/' + mountInfo.path,
          );
        newTeamDataList.push(
          new InputData(mountInfo.mountPoint, serverPath, config.name),
        );
      }
    }
    return newTeamDataList;
  }
}
