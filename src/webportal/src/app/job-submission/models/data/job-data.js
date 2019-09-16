import {
  CUSTOM_STORAGE_START,
  CUSTOM_STORAGE_END,
  STORAGE_PREFIX,
  AUTO_GENERATE_NOTIFY,
} from '../../utils/constants';
import { getProjectNameFromGit } from '../../utils/utils';
import { isEmpty } from 'lodash';

export class JobData {
  constructor(hdfsClient, customDataList, mountDirs, containData) {
    this.hdfsClient = hdfsClient || '';
    this.customDataList = customDataList || [];
    this.mountDirs = mountDirs || null;
    this.containData = containData || false;
  }

  async _generateCustomStorageCommands(userName, jobName) {
    const preCommand = [];
    preCommand.push(CUSTOM_STORAGE_START);
    preCommand.push(AUTO_GENERATE_NOTIFY);
    const hdfsConfigFile = '~/.hdfscli.cfg';
    const jobDir = `${STORAGE_PREFIX}${userName}/${jobName}`;
    preCommand.push(
      `pip install hdfs &>> storage_plugin.log && touch ${hdfsConfigFile} && echo '[dev.alias]' >> ${hdfsConfigFile} && echo 'url = ${this.hdfsClient.host}' >> ${hdfsConfigFile}`,
    );

    for (const dataItem of this.customDataList) {
      preCommand.push(
        `if [ ! -d ${dataItem.mountPath} ]; then mkdir --parents ${dataItem.mountPath}; fi &>> storage_plugin.log`,
      );
      if (dataItem.sourceType === 'http') {
        preCommand.push('apt-get install -y --no-install-recommends wget');
        preCommand.push(
          `wget ${dataItem.dataSource} -P ${dataItem.mountPath} &>> storage_plugin.log`,
        );
      } else if (dataItem.sourceType === 'git') {
        const projectName = getProjectNameFromGit(dataItem.dataSource);
        preCommand.push('apt-get install -y --no-install-recommends git');
        preCommand.push(
          `git clone ${dataItem.dataSource} ${dataItem.mountPath}/${projectName} &>> storage_plugin.log`,
        );
      } else if (dataItem.sourceType === 'hdfs') {
        preCommand.push(
          `hdfscli download --alias=dev ${dataItem.dataSource} ${dataItem.mountPath}`,
        );
      } else if (dataItem.sourceType === 'local') {
        const mountHdfsDir = `${jobDir}${dataItem.mountPath}`;
        if (dataItem.uploadFiles) {
          await Promise.all(
            dataItem.uploadFiles.map(file => {
              return this.hdfsClient.uploadFile(mountHdfsDir, file);
            }),
          );
          dataItem.uploadFiles.forEach(file => {
            preCommand.push(
              `hdfscli download --alias=dev ${mountHdfsDir}/${file.name} ${dataItem.mountPath}`,
            );
          });
        }
      }
    }

    preCommand.push(CUSTOM_STORAGE_END);
    return preCommand;
  }

  async generateDataCommands(userName, jobName) {
    let teamwiseCommands = [];
    if (!isEmpty(this.mountDirs)) {
      teamwiseCommands = this.mountDirs.getPaiCommand();
    }

    if (!isEmpty(this.customDataList)) {
      return this._generateCustomStorageCommands(userName, jobName).then(
        preCommands => {
          return teamwiseCommands.concat(preCommands);
        },
      );
    }

    return teamwiseCommands;
  }
}
