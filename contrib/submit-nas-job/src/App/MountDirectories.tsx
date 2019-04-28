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
import React, { ChangeEvent, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { join } from "path";
import Context from "./Context";

interface IGroup {
  readonly gpn: string;
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

  private generateMountCmd(serverData:any, mountPoint:string, relativePath:string): string | undefined {
    const serverType = serverData["type"];
    if (serverType == "nfs") {
      return `mount -t nfs4 ${serverData["address"]}:${this.normalizePath(`${serverData["rootPath"]}/${relativePath}`)} ${mountPoint}`;
    } else if (serverType == "samba") {
      return `mount -t cifs ${serverData["address"]}${this.normalizePath(`/${serverData["rootPath"]}/${relativePath}`)} ${mountPoint} -o username=${serverData["userName"]},password=${serverData["password"]},domain=${serverData["domain"]}`
    } else {
      return undefined;
    }
  } 

  private normalizePath(oriPath: string): string {
    return oriPath.replace("$USER", `${this.user}`).replace("$JOB", `${this.jobName}`).replace("//", "/");
  }

  public getPaiCommand() {
    const returnValue:string[] = [
      "apt-get update",
      "apt-get install --assume-yes nfs-common cifs-utils",
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
      const mountInfos = serverMountDict[spn];
      const server = this.servers.find(item => item.spn === spn);
      
      if (server !== undefined) {
        const folder:string = `/tmp_${spn}_root/`;
        const mountStr = this.generateMountCmd(server, folder, "");
        if (mountStr != undefined) {
          // Step1: Mount root folder and make sub directories
          returnValue.push(`mkdir --parents ${folder}`);
          returnValue.push(mountStr);
          
          for (const mountInfo of mountInfos) {
            const relativePath: string = this.normalizePath(mountInfo.path);
            // Create folder on server root path
            returnValue.push(`mkdir --parents ${join(folder, relativePath)}`,)
          }
          // umount server root path
          returnValue.push(`umount -l ${folder}`);
          returnValue.push(`rm -r ${folder}`);

          // Step2: Mount folder for mount infos
          for (const mountInfo of mountInfos) {
            // Mount
            let mountSubStr = this.generateMountCmd(server, folder, mountInfo.path);
            if (mountSubStr !== undefined) {
              returnValue.push(mountSubStr);
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
  const userGroups = ["g1", "g2"];

  const responseToData2 = (response: Response) => {
    if (response.ok) {
      return response.json().then((responseData) => responseData.data);
    } else {
      throw Error(`HTTP ${response.status}`);
    }
  };

  const [serverNames, setServerNames] = useState<string[]>([]);
  const [groups, setGroups] = useState<IGroup[]>([]);

  useEffect(() => {
    const storageGroupUrl = `${api}/api/v1/kubernetes/api/v1/namespaces/default/secrets/storage-group`;
    console.log(storageGroupUrl)
    fetch(storageGroupUrl).then(responseToData2).then((storageGroupData) => {
      console.log(storageGroupData)
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
              if (serverNames.indexOf(serverName) == -1) {
                console.log("serverName:" + serverName + " serverNames: " + serverNames)
                serverNames.push(serverName);
              }
            }
            setServerNames(serverNames.concat());
          }
        } catch (e) {
          // ignored
        }
      }
      setGroups(newGroups);
    });

    const storageUserUrl = `${api}/api/v1/kubernetes/api/v1/namespaces/default/secrets/storage-user`;
    try {
       fetch(storageUserUrl).then(responseToData2).then((storageUserData) => {
        if (user in storageUserData) {
          const userContent = JSON.parse(atob(storageUserData[user]));
          for (const serverName of userContent.servers) {
            if (serverNames.indexOf(serverName) == -1) {
              serverNames.push(serverName);
            }
          }
          setServerNames(serverNames.concat());
        }
      });
    } catch (e) {
      
    }
  }, []);

  const [servers, setServers] = useState<IServer[]>([]);
  useEffect(()=> {
    // Get Server info
    console.log(serverNames);
    const storageServerUrl = `${api}/api/v1/kubernetes/api/v1/namespaces/default/secrets/storage-server`;
    try {
       fetch(storageServerUrl).then(responseToData2).then((storageServerData) => {
        console.log(storageServerData)
        for (const serverName of serverNames) {
          if (serverName in storageServerData) {
            const serverContent = JSON.parse(atob(storageServerData[serverName]));
            if (servers.find(item => item.spn == serverContent.spn) === undefined) {
              servers.push(serverContent);
            }
          }
        }
        setServers(servers.concat());
      });
    } catch (e) {
      
    }    
  }, [serverNames])

  const [selectedGroups, setSelectedGroups] = useState<IGroup[]>([]);

  const onGroupCheckBoxChange  = useCallback((index: number, group:IGroup, value:boolean) => {
    if (value) {
      if (selectedGroups.find(item => item.gpn == group.gpn) === undefined) {
        console.log("index: " + index + " selectedGroupIndices: " + selectedGroups)
        selectedGroups.push(group);
      }
    } else {
      const oriGroupIndex = selectedGroups.find(item => item.gpn == group.gpn)
      if (oriGroupIndex !== undefined) {
        selectedGroups.splice(selectedGroups.indexOf(oriGroupIndex), 1)
      }
     }
     console.log(selectedGroups);
     setSelectedGroups(selectedGroups.concat())

     // Set MountDirectories
  }, []);


  const mountDirectories = useMemo(() => {
    return new MountDirectories(user, jobName, selectedGroups, servers);
  }, [user, jobName, selectedGroups, servers]);

  useEffect(() => {
    if (mountDirectories !== null) {
      onChange(mountDirectories);
    }
  }, [mountDirectories]);

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
        {groups.map((group, index) => {
          return (
          <div>
            <label>
              <input type="checkbox" key={index} onChange={(event) => onGroupCheckBoxChange(index, group, event.target.checked)}/>
              {group.gpn}
            </label>
            </div>)
        })}
      </div>

      <div>
        <label>
          Mount Info:
        </label>
        {selectedGroups.map((selectedGroupIndex, index) => {
          if (selectedGroupIndex.mountInfos !== undefined) {
            console.log("mountInfos: " + selectedGroupIndex.mountInfos);
            return selectedGroupIndex.mountInfos.map((mountInfo, index) => {
              // normalize path
              return (
              <div>
                <span className="input-group-addon">{mountInfo.mountPoint}</span>
                <span className="input-group-addon">{"[" + mountInfo.server + "]"}/{mountInfo.path}</span>
              </div>
              );
            }) 
          } else {
            return null;
          }
        })}
      </div>
    </div>
  );
}
