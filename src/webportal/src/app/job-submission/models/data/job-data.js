import {
  CUSTOM_STORAGE_START,
  CUSTOM_STORAGE_END,
  CUSTOM_MOUNT_START,
  CUSTOM_MOUNT_END,
  STORAGE_PREFIX,
  AUTO_GENERATE_NOTIFY,
} from '../../utils/constants';
import {getProjectNameFromGit} from '../../utils/utils';
import {isEmpty} from 'lodash';

export class JobData {
  constructor(hdfsClient, customDataList, mountDirs, containData, customMountList) {
    this.hdfsClient = hdfsClient || '';
    this.customDataList = customDataList || [];
    this.mountDirs = mountDirs || null;
    this.containData = containData || false;
    this.customMountList = customMountList || [];
  }

  async _generateCustomStorageCommands(userName, jobName) {
    const preCommand = [];
    preCommand.push(CUSTOM_STORAGE_START);
    preCommand.push(AUTO_GENERATE_NOTIFY);
    const hdfsConfigFile = '~/.hdfscli.cfg';
    const jobDir = `${STORAGE_PREFIX}${userName}/${jobName}`;
    preCommand.push(
      `pip install hdfs &>> storage_plugin.log && touch ${hdfsConfigFile} && echo '[dev.alias]' >> ${hdfsConfigFile} && echo 'url = ${
      this.hdfsClient.host
      }' >> ${hdfsConfigFile}`,
    );

    for (const dataItem of this.customDataList) {
      preCommand.push(
        `if [ ! -d ${dataItem.mountPath} ]; then mkdir --parents ${
        dataItem.mountPath
        }; fi &>> storage_plugin.log`,
      );
      if (dataItem.sourceType === 'http') {
        preCommand.push('apt-get install -y --no-install-recommends wget');
        preCommand.push(
          `wget ${dataItem.dataSource} -P ${
          dataItem.mountPath
          } &>> storage_plugin.log`,
        );
      } else if (dataItem.sourceType === 'git') {
        const projectName = getProjectNameFromGit(dataItem.dataSource);
        preCommand.push('apt-get install -y --no-install-recommends git');
        preCommand.push(
          `git clone ${dataItem.dataSource} ${
          dataItem.mountPath
          }/${projectName} &>> storage_plugin.log`,
        );
      } else if (dataItem.sourceType === 'hdfs') {
        preCommand.push(
          `hdfscli download --alias=dev ${dataItem.dataSource} ${
          dataItem.mountPath
          }`,
        );
      } else if (dataItem.sourceType === 'local') {
        const mountHdfsDir = `${jobDir}${dataItem.mountPath}`;
        if (dataItem.uploadFiles) {
          // eslint-disable-next-line no-await-in-loop
          await Promise.all(
            // eslint-disable-next-line no-loop-func
            dataItem.uploadFiles.map((file) => {
              return this.hdfsClient.uploadFile(mountHdfsDir, file);
            }),
          );
          dataItem.uploadFiles.forEach((file) => {
            preCommand.push(
              `hdfscli download --alias=dev ${mountHdfsDir}/${file.name} ${
              dataItem.mountPath
              }`,
            );
          });
        }
      }
    }

    preCommand.push(CUSTOM_STORAGE_END);
    return preCommand;
  }

  _generateCustomMountEnv() {
    let preCommand = [];
    preCommand.push('`#INIT_ENV`');
    preCommand.push('apt-get update');
    preCommand.push('apt-get install -y git fuse golang nfs-common');
    preCommand.push([
      'git clone --recursive https://github.com/Microsoft/hdfs-mount.git',
      'cd hdfs-mount',
      'make',
      'cp hdfs-mount /bin',
      'cd ..',
      'rm -rf hdfs-mount',
    ].join('&&'));
    return preCommand;
  }

  _generateCustomMountCommands() {
    let preCommand = [];
    preCommand.push(CUSTOM_MOUNT_START);
    preCommand.push(AUTO_GENERATE_NOTIFY);
    preCommand = preCommand.concat(this._generateCustomMountEnv());
    preCommand.push('`#MOUNT_STORAGE`');
    let hDFSCount = 0;
    let tempHDFSContainerPath = `/PAITMP/tempHDFSContainerPath_`;

    for (const customMount of this.customMountList) {
      const containerPath = customMount.mountPath;
      const type = customMount.sourceType;
      const dataSource = customMount.dataSource.split('//')[1];
      const hostIP = dataSource.split('/')[0].split(':')[0];
      const port = dataSource.split('/')[0].split(':')[1];
      const remotePath = '/' + dataSource.split('/').slice(1).join('/');
      preCommand.push(
        `if [ ! -d ${containerPath} ]; then mkdir --parents ${
        containerPath
        }; fi`,
      );
      switch (type) {
        case 'hdfsmount':
          preCommand.push(
            `if [ ! -d ${tempHDFSContainerPath}${hDFSCount} ]; then mkdir --parents ${
            tempHDFSContainerPath}${
            hDFSCount
            }; fi`,
          );
          preCommand.push(`(hdfs-mount ${hostIP}:${port} ${tempHDFSContainerPath}${hDFSCount} &)`);
          preCommand.push(`sleep 5`);
          preCommand.push(`rm -r ${containerPath}`);
          preCommand.push(`ln -s ${tempHDFSContainerPath}${hDFSCount}${remotePath} ${containerPath}`);
          hDFSCount++;
          break;
        case 'nfsmount':
          preCommand.push(`mount -t nfs4 ${hostIP}:${remotePath} ${containerPath}`);
          break;
      }
    }
    preCommand.push(CUSTOM_MOUNT_END);
    return preCommand;
  }

  async generateDataCommands(userName, jobName) {
    let teamwiseCommands = [];
    let customDataCommands = [];
    let customMountCommands = [];
    if (!isEmpty(this.mountDirs)) {
      teamwiseCommands = this.mountDirs.getPaiCommand();
    }
    if (!isEmpty(this.customDataList)) {
      customDataCommands = await this._generateCustomStorageCommands(userName, jobName);
    }
    if (!isEmpty(this.customMountList)) {
      customMountCommands = this._generateCustomMountCommands();
    }
    return teamwiseCommands.concat(customDataCommands).concat(customMountCommands);
  }
}
