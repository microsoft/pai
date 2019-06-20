/* !
 * Copyright (c) Microsoft Corporation
 * All rights reserved.
 *
 * MIT License
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import React, {useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';
import {Stack} from 'office-ui-fabric-react';
import {DefaultButton} from 'office-ui-fabric-react/lib/Button';
import {FontClassNames, FontWeights} from '@uifabric/styling';
import {cloneDeep} from 'lodash';
import c from 'classnames';
import PropTypes from 'prop-types';

import {InputData} from '../../models/data/input-data';
import {TeamMountList} from './team-mount-list';
import t from '../../../../app/components/tachyons.scss';
import config from '../../../config/webportal.config';

export default class MountDirectories {
  constructor(user, jobName, selectedConfigs, servers) {
    this.user = user;
    this.jobName = jobName;
    this.selectedConfigs = selectedConfigs;
    this.servers = servers;
  }

  getPaiCommand() {
    const returnValue = [
      'apt-get update',
      'apt-get install --assume-yes nfs-common cifs-utils sshpass wget',
      'umask 000',
      'declare -a MOUNTPOINTS=()',
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
      if (serverMountDict.hasOwnProperty(spn)) {
        const mountInfos = serverMountDict[spn];
        const server = this.servers.find((item) => item.spn === spn);

        if (server !== undefined) {
          const tmpFolder = `/tmp_${spn}_root/`;

          const preCmds = this.generatePreMountCmds(server, tmpFolder);
          if (preCmds !== undefined) {
            for (const preCmd of preCmds) {
              returnValue.push(preCmd);
            }
          }

          // Step1: Mount root folder and make sub directories
          const mountStrs = this.generateMountCmds(server, tmpFolder, '', tmpFolder);
          if (mountStrs !== undefined) {
            for (const mountStr of mountStrs) {
              returnValue.push(mountStr);
            }
          }

          for (const mountInfo of mountInfos) {
            // Check duplicated mount points
            if (mountPoints.includes(mountInfo.mountPoint)) {
              throw new Error('Mount point error! More than one mount point [' + mountInfo.mountPoint + ']!');
            } else {
              mountPoints.push(mountInfo.mountPoint);
            }

            // Create folder on server root path
            returnValue.push(`mkdir --parents ${mountInfo.mountPoint}`);
            returnValue.push(`mkdir --parents ${this.normalizePath(tmpFolder + mountInfo.path)}`);
            // Monitor mount point
            returnValue.push('MOUNTPOINTS=(${MOUNTPOINTS[@]} ' + mountInfo.mountPoint + ')');
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
            const mountSubStrs = this.generateMountCmds(server, mountInfo.mountPoint, mountInfo.path, tmpFolder);
            if (mountSubStrs !== undefined) {
              for (const mountStr of mountSubStrs) {
                returnValue.push(mountStr);
              }
            }
          }
        }
      }
    }
    return returnValue.join(' && ');
  }

  applyJSON({selectedConfigs, servers}) {
    Object.assign(this, {selectedConfigs, servers});
  }

  toJSON() {
    const {selectedConfigs, servers} = this;
    return {selectedConfigs, servers};
  }

  generatePreMountCmds(serverData, tmpFolder) {
    const serverType = serverData.type;
    let returnValue;

    switch (serverType) {
      case 'nfs':
      case 'samba':
        returnValue = [`mkdir --parents ${tmpFolder}`];
        break;
      case 'azurefile':
        returnValue = [`mkdir --parents ${tmpFolder}`];
        if (serverData.proxy !== undefined && serverData.proxy.length === 2) {
          const proxyInfo = serverData.proxy[0];
          const proxyPassword = serverData.proxy[1];
          const proxyIp = proxyInfo.indexOf('@') === -1 ? proxyInfo : proxyInfo.substring(proxyInfo.indexOf('@') + 1);
          returnValue.push(`mkdir --parents ~/.ssh`);
          returnValue.push(`ssh-keyscan ${proxyIp} >> ~/.ssh/known_hosts`);
          returnValue.push(`sshpass -p '${proxyPassword}'` +
          ` ssh -N -f -L 445:${serverData.dataStore}:445 ${proxyInfo}`);
        }
        break;
      case 'azureblob':
        const tmpPath = `/mnt/resource/blobfusetmp/${serverData.spn}`;
        const cfgFile = `/${serverData.spn}.cfg`;
        returnValue = [
        'apt-get install --assume-yes lsb-release apt-transport-https',
        'valid_release=(\'14.04\' \'15.10\' \'16.04\' \'16.10\' \'17.04\' \'17.10\' \'18.04\' \'18.10\' \'19.04\')',
        'release=`lsb_release -r | cut -f 2`',
        'if [[ ! ${valid_release[@]} =~ ${release} ]]; then echo "Invalid OS version for Azureblob!"; exit 1; fi',
        'wget https://packages.microsoft.com/config/ubuntu/${release}/packages-microsoft-prod.deb',
        'dpkg -i packages-microsoft-prod.deb',
        'apt-get update',
        'apt-get install --assume-yes blobfuse fuse', // blob to mount and fuse to unmount
        `mkdir --parents ${tmpPath}`,
        // Generate mount point
        `echo "accountName ${serverData.accountName}" >> ${cfgFile}`,
        `echo "accountKey ${serverData.key}" >> ${cfgFile}`,
        `echo "containerName ${serverData.containerName}" >> ${cfgFile}`,
        `echo "blobEndPoint ${serverData.dataStore}" >> ${cfgFile}`,
        `chmod 600 ${cfgFile}`,
        `mkdir --parents ${tmpFolder}`,
        ];
        break;
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
        returnValue = [
          `umount -l ${tmpFolder}`,
          `rm -r ${tmpFolder}`,
        ];
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
            serverData.rootPath + '/' + relativePath)} ${mountPoint}`,
        ];
      case 'samba':
        return [
          `mount -t cifs //${serverData.address}${this.normalizePath(
            '/' + serverData.rootPath + '/' + relativePath)} ${mountPoint} -o vers=3.0,username=${
            serverData.userName},password=${serverData.password}` +
            (serverData.domain !== undefined && serverData.domain.length > 0 ? `,domain=${serverData.domain}` : ''),
          ];
      case 'azurefile':
        if (serverData.proxy !== undefined) {
          return [
            `mount -t cifs //localhost/${this.normalizePath(
              serverData.fileShare + '/' + relativePath)} ${mountPoint} -o vers=3.0,username=${
                serverData.accountName},password=${serverData.key},dir_mode=0777,file_mode=0777,serverino`,
              ];
        } else {
          return [
            `mount -t cifs //${serverData.dataStore}/${this.normalizePath(
              serverData.fileShare + '/' + relativePath)} ${mountPoint} -o vers=3.0,username=${
                serverData.accountName},password=${serverData.key},dir_mode=0777,file_mode=0777,serverino`,
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
            `ln -s ${this.normalizePath(tmpFolder + relativePath)} ${mountPoint}`,
          ];
        }
      default:
        return undefined;
    }
  }

  normalizePath(oriPath) {
    return oriPath.replace(/%USER/ig, this.user).replace(/%JOB/ig, this.jobName).replace('//', '/');
  }

  getTeamDataList() {
    let newTeamDataList = [];
    for (const config of this.selectedConfigs) {
      for (const mountInfo of config.mountInfos) {
        newTeamDataList.push(new InputData(mountInfo.mountPoint, this.normalizePath('[' + mountInfo.server + ']/' + mountInfo.path), config.name));
      }
    }
    return newTeamDataList;
  }
}


const user = cookies.get('user');

export const TeamStorage = (props) => {
  const {onChange, jobName} = props;

  const responseToData = (response) => {
    if (response.ok) {
      return response.json().then((responseData) => responseData.data);
    } else {
      throw Error(`HTTP ${response.status}`);
    }
  };

  const normalizePath = (oriPath) => {
    return oriPath.replace(/%USER/ig, user).replace(/%JOB/ig, jobName).replace('//', '/');
  };

  const api = config.restServerUri;
  const user = cookies.get('user');
  const token = cookies.get('token');

  const [userGroups, setUserGroups] = useState([]);
  const [serverNames, setServerNames] = useState([]);
  const [configs, setConfigs] = useState([]);
  // const [selectedConfigs, setSelectedConfigs] = useState(get(defaultValue, 'selectedConfigs', []));
  const [selectedConfigs, setSelectedConfigs] = useState([]);

  useEffect(() => {
    const userInfoUrl = `${api}/api/v2/user/${user}`;
    fetch(userInfoUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }).then((response) => {
      if (response.ok) {
        response.json().then((responseData) => responseData.grouplist).then((groupList) => {
          setUserGroups(groupList);
        });
      } else {
        setUserGroups(['paigroup']);
        throw Error(`HTTP ${response.status}`);
      }
    });
  }, []);

  useEffect(() => {
    if (userGroups.length === 0) {
      return;
    }

    const storageConfigUrl = `${api}/api/v1/kubernetes/api/v1/namespaces/pai-storage/secrets/storage-config`;
    fetch(storageConfigUrl).then(responseToData).then((storageConfigData) => {
      const newConfigs = [];
      for (const confName of Object.keys(storageConfigData)) {
        try {
          const config = JSON.parse(atob(storageConfigData[confName]));
          for (const gpn of userGroups) {
            if (config.gpn !== gpn) {
              continue;
            } else {
              const selectedConfig = selectedConfigs.find((conf) => conf.name === config.name);
              console.log(selectedConfig);
              if (selectedConfig === undefined) {
                newConfigs.push(config);
              } else {
                newConfigs.push(selectedConfig);
              }

              if (config.servers !== undefined) {
                for (const serverName of config.servers) {
                  if (serverNames.indexOf(serverName) === -1) {
                    serverNames.push(serverName);
                  }
                }
              }
              // Auto select default mounted configs
              if (/* defaultValue === null && */config.default === true &&
                selectedConfigs.find((conf) => conf.name === config.name) === undefined) {
                selectedConfigs.push(config);
              }
            }
          }
        } catch (e) {
          // ignored
        }
      }

      setConfigs(newConfigs);
      setSelectedConfigs(selectedConfigs.concat());
      setServerNames(serverNames.concat());
    });


    const storageUserUrl = `${api}/api/v1/kubernetes/api/v1/namespaces/pai-storage/secrets/storage-user`;
    try {
       fetch(storageUserUrl).then(responseToData).then((storageUserData) => {
        if (user in storageUserData) {
          const userContent = JSON.parse(atob(storageUserData[user]));
          for (const serverName of userContent.servers) {
            if (serverNames.indexOf(serverName) === -1) {
              serverNames.push(serverName);
            }
          }
          setServerNames(serverNames.concat());
        }
      });
    } catch (e) {
      // Do nothing
    }
  }, [userGroups]);

  const [servers, setServers] = useState([]);
  useEffect(() => {
    // Get Server info
    const storageServerUrl = `${api}/api/v1/kubernetes/api/v1/namespaces/pai-storage/secrets/storage-server`;
    try {
       fetch(storageServerUrl).then(responseToData).then((storageServerData) => {
        for (const serverName of serverNames) {
          if (serverName in storageServerData) {
            const serverContent = JSON.parse(atob(storageServerData[serverName]));
            if (servers.find((item) => item.spn === serverContent.spn) === undefined) {
              servers.push(serverContent);
            }
          }
        }
        setServers(servers.concat());
      });
    } catch (e) {
      // Do nothing
    }
  }, [serverNames]);

  const onSCChange = useCallback((config, value) => {
    if (value) {
      if (selectedConfigs.find((item) => item.name === config.name) === undefined) {
        selectedConfigs.push(config);
      }
    } else {
      const oriConfigIndex = selectedConfigs.find((item) => item.name === config.name);
      if (oriConfigIndex !== undefined) {
        selectedConfigs.splice(selectedConfigs.indexOf(oriConfigIndex), 1);
      }
    }
    setSelectedConfigs(selectedConfigs.concat());
  }, []);

  const mountDirectories = useMemo(() => {
    return new MountDirectories(user, jobName, selectedConfigs, servers);
  }, [user, jobName, selectedConfigs, servers]);

  useEffect(() => {
    if (mountDirectories !== null) {
      onChange(mountDirectories);
    }
  }, [mountDirectories]);

  const showConfigs = (config, index) => {
    console.log(config);
    return (
      <DefaultButton
      key={config.name}
      text={config.name}
      toggle={true}
      checked={selectedConfigs.find((sc) => sc.name === config.name) !== undefined}
      onClick={(event) => {
        let selected = (selectedConfigs.find((sc) => sc.name === config.name) !== undefined);
        onSCChange(config, !selected);
      }}
      />
    );
  };

  const getServerPath = useCallback((serverName) => {
    let returnValue = '';

    const server = servers.find((srv) => srv.spn === serverName);
    if (server !== undefined) {
      switch (server.type) {
        case 'nfs':
          returnValue = server.address + ':' + server.rootPath;
          break;
        case 'samba':
          returnValue = '//' + server.address + '/' + server.rootPath;
          break;
        case 'azurefile':
          returnValue = server.dataStore + '/' + server.fileShare;
          break;
        case 'azureblob':
          returnValue = server.dataStore + '/' + server.containerName;
          break;
      }
    }
    return returnValue;
  }, [servers]);


  const showConfigSets = () => {
    if (userGroups.length === 0) {
      return null;
    } else {
      return (
        <div>
          <div className={c(FontClassNames.mediumPlus, t.pb2)} style={{fontWeight: FontWeights.semibold}}>Team Share Storage</div>
          <Stack horizontal disableShrink gap='s1'>
          {configs.map((config, index) => showConfigs(config, index))}
          </Stack>
        </div>
      );
    }
  };


  return (
    <div>
      {showConfigSets()}
      <TeamMountList dataList={mountDirectories == null ? [] : mountDirectories.getTeamDataList()} setDataList={null} />
    </div>
  );
};

TeamStorage.propTypes = {
  // mountDirectories: PropTypes.instanceOf(MountDirectories),
  onChange: PropTypes.func,
  jobName: PropTypes.string,
};
