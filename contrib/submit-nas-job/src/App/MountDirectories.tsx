/*!
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
import get from "lodash.get";
import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import Context from "./Context";

import Button from "@material-ui/core/Button";
import Tooltip from "@material-ui/core/Tooltip";

const configDivStyle: React.CSSProperties = {
  width: "300px",
  verticalAlign: "middle",
  display: "inline-block",
};

const mountPointTableDataStyle: React.CSSProperties = {
  width: "35%",
  verticalAlign: "middle",
};

interface IConfig {
  readonly name: string;
  readonly gpn: string;
  readonly default: boolean;
  readonly mountInfos: IMountInfo[];
}

interface IMountInfo {
  mountPoint: string;
  readonly server: string;
  readonly path: string;
}

interface IServer {
  readonly spn: string;
  readonly type: string;
  readonly address?: string;
  readonly rootPath?: string;
  readonly userName?: string;
  readonly password?: string;
  readonly domain?: string;
  readonly dataStore?: string;
  readonly fileShare?: string;
  readonly accountName?: string;
  readonly containerName?: string;
  readonly key?: string;
  readonly proxy?: string[];
}

export interface IMountDirectoriesObject {
  readonly selectedConfigs: IConfig[];
  readonly servers: IServer[];
}

export default class MountDirectories {
  constructor(
    private readonly user: string,
    private readonly jobName: string,

    private readonly selectedConfigs: IConfig[],
    private readonly servers: IServer[],
  ) {}

  public getPaiCommand() {
    const returnValue: string[] = [
      "apt-get update",
      "apt-get install --assume-yes nfs-common cifs-utils sshpass wget",
      "umask 000",
      "declare -a MOUNTPOINTS=()",
    ];

    const serverMountDict: { [spn: string]: IMountInfo[] } = {};

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

    const mountPoints: string[] = [];

    for (const spn in serverMountDict) {
      if (serverMountDict.hasOwnProperty(spn)) {
        const mountInfos = serverMountDict[spn];
        const server = this.servers.find((item) => item.spn === spn);

        if (server !== undefined) {
          const tmpFolder: string = `/tmp_${spn}_root/`;

          const preCmds: string[] | undefined = this.generatePreMountCmds(server, tmpFolder);
          if (preCmds !== undefined) {
            for (const preCmd of preCmds) {
              returnValue.push(preCmd);
            }
          }

          // Step1: Mount root folder and make sub directories
          const mountStrs = this.generateMountCmds(server, tmpFolder, "", tmpFolder);
          if (mountStrs !== undefined) {
            for (const mountStr of mountStrs) {
              returnValue.push(mountStr);
            }
          }

          for (const mountInfo of mountInfos) {
            // Check duplicated mount points
            if (mountPoints.includes(mountInfo.mountPoint)) {
              throw new Error("Mount point error! More than one mount point [" + mountInfo.mountPoint + "]!");
            } else {
              mountPoints.push(mountInfo.mountPoint);
            }

            // Create folder on server root path
            returnValue.push(`mkdir --parents ${mountInfo.mountPoint}`);
            returnValue.push(`mkdir --parents ${this.normalizePath(tmpFolder + mountInfo.path)}`);
            // Monitor mount point
            returnValue.push("MOUNTPOINTS=(${MOUNTPOINTS[@]} " + mountInfo.mountPoint + ")");
          }

          const postCmds: string[] | undefined = this.generatePostMountCmds(server, tmpFolder);
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
    return returnValue.join(" && ");
  }

  public applyJSON({ selectedConfigs, servers }: IMountDirectoriesObject) {
    Object.assign(this, { selectedConfigs, servers });
  }

  public toJSON(): IMountDirectoriesObject {
    const { selectedConfigs, servers } = this;
    return { selectedConfigs, servers } ;
  }

  private generatePreMountCmds(serverData: IServer, tmpFolder: string): string[] | undefined {
    const serverType = serverData.type;
    let returnValue: string[] | undefined;

    switch (serverType) {
      case "nfs":
      case "samba":
        returnValue = [`mkdir --parents ${tmpFolder}`];
        break;
      case "azurefile":
        returnValue = [`mkdir --parents ${tmpFolder}`];
        if (serverData.proxy !== undefined && serverData.proxy.length === 2) {
          const proxyInfo: string = serverData.proxy[0];
          const proxyPassword: string = serverData.proxy[1];
          const proxyIp = proxyInfo.indexOf("@") === -1 ? proxyInfo : proxyInfo.substring(proxyInfo.indexOf("@") + 1);
          returnValue.push(`mkdir --parents ~/.ssh`);
          returnValue.push(`ssh-keyscan ${proxyIp} >> ~/.ssh/known_hosts`);
          returnValue.push(`sshpass -p '${proxyPassword}'` +
          ` ssh -N -f -L 445:${serverData.dataStore}:445 ${proxyInfo}`);
        }
        break;
      case "azureblob":
        const tmpPath = `/mnt/resource/blobfusetmp/${serverData.spn}`;
        const cfgFile = `/${serverData.spn}.cfg`;
        returnValue = [
        // "wget https://packages.microsoft.com/config/ubuntu/14.04/packages-microsoft-prod.deb",
        "wget https://packages.microsoft.com/config/ubuntu/18.04/packages-microsoft-prod.deb",
        "dpkg -i packages-microsoft-prod.deb",
        "apt-get update",
        "apt-get install --assume-yes blobfuse fuse",  // blob to mount and fuse to unmount
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
      default:
        break;
    }
    return returnValue;
  }

  private generatePostMountCmds(serverData: IServer, tmpFolder: string): string[] | undefined {
    let returnValue;
    const serverType = serverData.type;
    switch (serverType) {
      case "nfs":
      case "samba":
      case "azurefile":
        // umount server root path
        returnValue = [
          `umount -l ${tmpFolder}`,
          `rm -r ${tmpFolder}`,
        ];
        break;
      case "azureblob":
        // Use ln for azure blob, does not mount folder separately
        // Can use 'fusermount -u </path/to/mountpoint>' to unmount. fusermount is from fuse package
        break;
    }
    return returnValue;
  }

  // tslint:disable-next-line:max-line-length
  private generateMountCmds(serverData: IServer, mountPoint: string, relativePath: string, tmpFolder: string): string[] | undefined {
    const serverType = serverData.type;
    switch (serverType) {
      case "nfs":
        return [
          `mount -t nfs4 ${serverData.address}:${this.normalizePath(
            serverData.rootPath + "/" + relativePath)} ${mountPoint}`,
        ];
      case "samba":
        return [
          `mount -t cifs //${serverData.address}${this.normalizePath(
          "/" + serverData.rootPath + "/" + relativePath)} ${mountPoint} -o username=${
            serverData.userName},password=${serverData.password}` +
            (serverData.domain !== undefined && serverData.domain.length > 0 ? `,domain=${serverData.domain}` : ""),
          ];
      case "azurefile":
        if (serverData.proxy !== undefined) {
          return [
            `mount -t cifs //localhost/${this.normalizePath(
              serverData.fileShare + "/" + relativePath)} ${mountPoint} -o vers=3.0,username=${
                serverData.accountName},password=${serverData.key},dir_mode=0777,file_mode=0777,serverino`,
              ];
        } else {
          return [
            `mount -t cifs //${serverData.dataStore}/${this.normalizePath(
              serverData.fileShare + "/" + relativePath)} ${mountPoint} -o vers=3.0,username=${
                serverData.accountName},password=${serverData.key},dir_mode=0777,file_mode=0777,serverino`,
              ];
        }
      case "azureblob":
        if (mountPoint === tmpFolder) {
          // Mount azureblob endpoint
          const tmpPath = `/mnt/resource/blobfusetmp/${serverData.spn}`;
          const cfgFile = `/${serverData.spn}.cfg`;
          return [
            `blobfuse ${tmpFolder} --tmp-path=${tmpPath} --config-file=${cfgFile} -o attr_timeout=240 ` +
            `-o entry_timeout=240 -o negative_timeout=120`,
          ];
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

  private normalizePath(oriPath: string): string {
    return oriPath.replace(/%USER/ig, this.user).replace(/%JOB/ig, this.jobName).replace("//", "/");
  }
}

interface IProps {
  jobName: string;
  defaultValue: IMountDirectoriesObject | null;
  onChange(mountDirectories: MountDirectories): void;
}

export function MountDirectoriesForm({
  jobName,
  defaultValue,
  onChange,
}: IProps) {
  const responseToData = (response: Response) => {
    if (response.ok) {
      return response.json().then((responseData) => responseData.data);
    } else {
      throw Error(`HTTP ${response.status}`);
    }
  };

  const normalizePath = (oriPath: string) => {
    return oriPath.replace(/%USER/ig, user).replace(/%JOB/ig, jobName).replace("//", "/");
  };

  const { api, user } = useContext(Context);

  const [userGroups, setUserGroups] = useState<string[]>([]);
  const [serverNames, setServerNames] = useState<string[]>([]);
  const [configs, setConfigs] = useState<IConfig[]>([]);
  const [selectedConfigs, setSelectedConfigs] = useState<IConfig[]>(get(defaultValue, "selectedConfigs", []));

  useEffect(() => {
    const userInfoUrl = `${api}/api/v2/user/${user}`;
    fetch(userInfoUrl).then((response: Response) => {
      if (response.ok) {
        response.json().then((responseData) => responseData.grouplist).then((groupList) => {
          setUserGroups(groupList);
        });
      } else {
        throw Error(`HTTP ${response.status}`);
      }
    });
  }, []);

  useEffect(() => {
    if (userGroups.length === 0) {
      return;
    }

    const storageConfigUrl = `${api}/api/v1/kubernetes/api/v1/namespaces/default/secrets/storage-config`;
    fetch(storageConfigUrl).then(responseToData).then((storageConfigData) => {
      const newConfigs = [];
      for (const gpn of userGroups) {
        try {
          for (const confName of Object.keys(storageConfigData)) {
            const config = JSON.parse(atob(storageConfigData[confName]));
            if (config.gpn !== gpn) {
              continue;
            } else {
              const selectedConfig = selectedConfigs.find((conf) => conf.name === config.name);
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
              if (defaultValue === null && config.default === true &&
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

    const storageUserUrl = `${api}/api/v1/kubernetes/api/v1/namespaces/default/secrets/storage-user`;
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

  const [servers, setServers] = useState<IServer[]>([]);
  useEffect(() => {
    // Get Server info
    const storageServerUrl = `${api}/api/v1/kubernetes/api/v1/namespaces/default/secrets/storage-server`;
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

  const onSCChange  = useCallback((config: IConfig, value: boolean) => {
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

  const showConfigs = (config: IConfig, index: number) => {
    return (
      <div key={config.name} style={configDivStyle}>
        <label>
          {/* tslint:disable-next-line:jsx-no-lambda tslint:disable-next-line: max-line-length*/}
          <input type="checkbox" key={index} checked={selectedConfigs.find((sc) => sc.name === config.name) !== undefined} onChange={(event) => onSCChange(config, event.target.checked)}/>
          {config.name}
        </label>
      </div>);
  };

  const getServerPath = useCallback((serverName: string) => {
    let returnValue: string = "";

    const server = servers.find((srv) => srv.spn === serverName);
    if (server !== undefined) {
      switch (server.type) {
        case "nfs":
          returnValue = server.address + ":" + server.rootPath;
          break;
        case "samba":
          returnValue = "//" + server.address + "/" + server.rootPath;
          break;
        case "azurefile":
          returnValue = server.dataStore + "/" + server.fileShare;
          break;
        case "azureblob":
          returnValue = server.dataStore + "/" + server.containerName;
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
          <label htmlFor="job-nas">
            <span className="text-danger">*</span> Network attached storage:
          </label>
          <div>
            <label>
              Group NAS Config Sets :
            </label>
          </div>
          {configs.map((config, index) => showConfigs(config, index))}
        </div>
      );
    }
  };

  const showMountDiv = () => {
    if (selectedConfigs.length === 0) {
      return null;
    } else {
      return (
        <div>
          <label>
            Mount Info:
          </label>
          <table className="table table-striped table-dark">
            <thead>
              <tr>
                <th scope="col" style={mountPointTableDataStyle}>MountPoint</th>
                <th scope="col">ServerPath</th>
                <th scope="col">Config</th>
              </tr>
            </thead>
            <tbody>
            {selectedConfigs.map((selectedConfig) => showConfigMounts(selectedConfig))}
            </tbody>
          </table>
        </div>
        );
    }
  };

  const showConfigMounts = (selectedConfig: IConfig) => {
    {
      if (selectedConfig.mountInfos !== undefined) {
        return selectedConfig.mountInfos.map((mountInfo, index) => {
          return (
          <tr key={selectedConfig.name + "_" + index}>
            <td>
              <div className="input-group">
                <input
                  type="text"
                  className="form-control"
                  id="data-path"
                  defaultValue={mountInfo.mountPoint}
// tslint:disable-next-line: jsx-no-lambda
                  onChange={(newValue) => {mountInfo.mountPoint = newValue.target.value; }}
                />
              </div>
            </td>
            <td>
              <Tooltip title={getServerPath(mountInfo.server)} placement="left">
              <Button>{"[" + mountInfo.server + "]"}</Button>
              </Tooltip>
              /{normalizePath(mountInfo.path)}
            </td>
            <td>
              {selectedConfig.name}
            </td>
          </tr>
          );
        });
      } else {
        return null;
      }
    }
  };

  return (
    <div>
      {showConfigSets()}
      {showMountDiv()}
    </div>
  );
}
