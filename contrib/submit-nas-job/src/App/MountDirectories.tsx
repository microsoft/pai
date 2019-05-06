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

const groupDivStyle: React.CSSProperties = {
  width: "300px",
  verticalAlign: "middle",
  display: "inline-block",
};

const mountPointTableDataStyle: React.CSSProperties = {
  width: "35%",
  verticalAlign: "middle",
};

interface IGroup {
  readonly gpn: string;
  readonly default: boolean;
  readonly mountInfos: IMountInfo[];
}

interface IMountInfo {
  readonly mountPoint: string;
  readonly server: string;
  readonly path: string;
}

interface IServer {
  readonly spn: string;
  readonly type: string;
}

export interface IMountDirectoriesObject {
  readonly selectedGroups: IGroup[];
  readonly servers: IServer[];
}

export default class MountDirectories {
  constructor(
    private readonly user: string,
    private readonly jobName: string,

    private readonly selectedGroups: IGroup[],
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

    for (const group of this.selectedGroups) {
      if (group.mountInfos !== undefined) {
        for (const mountInfo of group.mountInfos) {
          if (mountInfo.server in serverMountDict) {
            serverMountDict[mountInfo.server].push(mountInfo);
          } else {
            serverMountDict[mountInfo.server] = [mountInfo];
          }
        }
      }
    }

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

  public applyJSON({ selectedGroups, servers }: IMountDirectoriesObject) {
    Object.assign(this, { selectedGroups, servers });
  }

  public toJSON(): IMountDirectoriesObject {
    const { selectedGroups, servers } = this;
    return { selectedGroups, servers } ;
  }

  private generatePreMountCmds(serverData: any, tmpFolder: string): string[] | undefined {
    const serverType = serverData.type;
    let returnValue: string[] | undefined;

    switch (serverType) {
      case "nfs":
      case "samba":
        returnValue = [`mkdir --parents ${tmpFolder}`];
        break;
      case "azurefile":
        returnValue = [`mkdir --parents ${tmpFolder}`];
        if ("proxy" in serverData) {
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

  private generatePostMountCmds(serverData: any, tmpFolder: string): string[] | undefined {
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
  private generateMountCmds(serverData: any, mountPoint: string, relativePath: string, tmpFolder: string): string[] | undefined {
    const serverType = serverData.type;
    switch (serverType) {
      case "nfs":
        return [
          `mount -t nfs4 ${serverData.address}:${this.normalizePath(
            `${serverData.rootPath}/${relativePath}`)} ${mountPoint}`,
        ];
      case "samba":
        return [
          `mount -t cifs //${serverData.address}${this.normalizePath(
          `/${serverData.rootPath}/${relativePath}`)} ${mountPoint} -o username=${
            serverData.userName},password=${serverData.password}` +
            (serverData.domain.length > 0 ? `,domain=${serverData.domain}` : ""),
          ];
      case "azurefile":
        if ("proxy" in serverData) {
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
  const { api, user } = useContext(Context);

  // TODO: Get userGroups from UserManager
  const userGroups = ["GROUP_NFS", "GROUP_SAMBA", "GROUP_AZUREFILE", "GROUP_AZUREBLOB", "GROUP_MIX"];

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

  const [serverNames, setServerNames] = useState<string[]>([]);
  const [groups, setGroups] = useState<IGroup[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<IGroup[]>(get(defaultValue, "selectedGroups", []));

  useEffect(() => {
    const storageGroupUrl = `${api}/api/v1/kubernetes/api/v1/namespaces/default/secrets/storage-group`;
    fetch(storageGroupUrl).then(responseToData).then((storageGroupData) => {
      const newGroups = [];
      for (const groupName of userGroups) {
        try {
          if (!(groupName in storageGroupData)) {
            continue;
          }
          const groupContent = JSON.parse(atob(storageGroupData[groupName]));
          newGroups.push(groupContent);
          if (groupContent.servers !== undefined) {
            for (const serverName of groupContent.servers) {
              if (serverNames.indexOf(serverName) === -1) {
                serverNames.push(serverName);
              }
            }
            setServerNames(serverNames.concat());
          }
        } catch (e) {
          // ignored
        }
      }
      // Auto select default mounted groups
      if (defaultValue === null) {
        for (const group of newGroups ) {
          if (group.default === true) {
            selectedGroups.push(group);
          }
        }
        setSelectedGroups(selectedGroups.concat());
      }

      setGroups(newGroups);
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
  }, []);

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

  const onSGChange  = useCallback((group: IGroup, value: boolean) => {
    if (value) {
      if (selectedGroups.find((item) => item.gpn === group.gpn) === undefined) {
        selectedGroups.push(group);
      }
    } else {
      const oriGroupIndex = selectedGroups.find((item) => item.gpn === group.gpn);
      if (oriGroupIndex !== undefined) {
        selectedGroups.splice(selectedGroups.indexOf(oriGroupIndex), 1);
      }
     }
    setSelectedGroups(selectedGroups.concat());
  }, []);

  const mountDirectories = useMemo(() => {
    return new MountDirectories(user, jobName, selectedGroups, servers);
  }, [user, jobName, selectedGroups, servers]);

  useEffect(() => {
    if (mountDirectories !== null) {
      onChange(mountDirectories);
    }
  }, [mountDirectories]);

  const showGroups = (group: IGroup, index: number) => {
    return (
      <div key={group.gpn} style={groupDivStyle}>
        <label>
          {/* tslint:disable-next-line:jsx-no-lambda tslint:disable-next-line: max-line-length*/}
          <input type="checkbox" key={index} checked={selectedGroups.find((sg) => sg.gpn === group.gpn) !== undefined} onChange={(event) => onSGChange(group, event.target.checked)}/>
          {group.gpn}
        </label>
      </div>);
  };

  const showMountInfos = (selectedGroup: IGroup) => {
    {
      if (selectedGroup.mountInfos !== undefined) {
        return selectedGroup.mountInfos.map((mountInfo, index) => {
          return (
          <tr key={selectedGroup.gpn + "_" + index}>
            <td data-tooltip="asdf">{mountInfo.mountPoint}</td>
            <td>
              {"[" + mountInfo.server + "]"}/{normalizePath(mountInfo.path)}</td>
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
      <div>
        <label htmlFor="job-name">
          <span className="text-danger">*</span> Mounts
        </label>
      </div>

      <div>
        <label>
          User Groups:
        </label>
      </div>
      {groups.map((group, index) => showGroups(group, index))}

      <div>
        <label>
          Mount Info:
        </label>
        <table className="table table-striped table-dark">
          <thead>
            <tr>
              <th scope="col" style={mountPointTableDataStyle}>MountPoint</th>
              <th scope="col">ServerPath</th>
            </tr>
          </thead>
          <tbody>
          {selectedGroups.map((selectedGroup) => showMountInfos(selectedGroup))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
