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
import React, { useContext, useEffect, useMemo } from "react";

import get from "lodash.get";
import { join, relative } from "path";

import Context from "./Context";
import { usePromise, useValue } from "./hooks";
import { string } from "prop-types";
import { Dictionary } from "lodash";


class MountInfo {
  constructor(
    readonly from: string,
    readonly mountPoint: string,
    readonly server: string,
    readonly path: string,
  ) {}  
} 


export interface IMountDirectoriesObject {
  readonly mountInfos: MountInfo[];
}

export default class MountDirectories {
  constructor(
    //private readonly nfsRoot: string,
    readonly user: string,
    readonly jobName: string,
    readonly groups: any[],
    readonly serverDict: { [spn: string]: any },
    readonly groupSel: string | undefined,
    readonly mountInfos: MountInfo[],
  ) {}

  
  private normalizePath(oriPath: string): string {
    return oriPath.replace("$USER", `${this.user}`).replace("$JOB", `${this.jobName}`);
  }

  private generateMountCmd(serverData:any, mountPoint:string, relativePath:string): string | undefined {
    let serverType = serverData["type"];
    if (serverType == "nfs") {
      return `mount -t nfs4 ${join(serverData["address"], ":", serverData["rootPath"], "/", relativePath)} ${mountPoint}`;
    } else if (serverType == "samba") {
      return undefined;
    } else {
      return undefined;
    }
  } 

  public getPaiCommand() {
    
    let serverMountDict: { [spn: string]: MountInfo[] } = {};
    
    for (let mountInfo of this.mountInfos) {
      if (mountInfo.server in serverMountDict) {
        serverMountDict[mountInfo.server].push(mountInfo);
      } else {
        serverMountDict[mountInfo.server] = [mountInfo];
      }
    }

    let returnValue:string[] = ["apt-get update"];
    
    for (let spn in serverMountDict) {
      let mountInfos = serverMountDict[spn];
      let server = this.serverDict[spn];
      if (server != undefined) {
        
        let folder:string = `/tmp_${spn}_root/`;
        returnValue.push(`mkdir --parents ${folder}`);
        let mountStr = this.generateMountCmd(server, folder, "");
        if (mountStr != undefined) {
          returnValue.push(mountStr);
        }                
        //TODO: mount server root path
        for (let mountInfo of mountInfos) {
          let relativePath: string = this.normalizePath(mountInfo.path);
 
          // Create folder on server root path
          returnValue.push(`mkdir --parents ${join(folder, relativePath)}`,)
          // Mount
          let mountStr = this.generateMountCmd(server, folder, relativePath);
          if (mountStr !== undefined) {
            returnValue.push(mountStr);
          }
        }
        // umount server root path

        returnValue.push(`umount -l ${folder}`);
        returnValue.push(`rm -r ${folder}`);
      }
      

    }


    return returnValue.join(" && ");
  }

  public applyJSON({ mountInfos }: IMountDirectoriesObject) {
    Object.assign(this, { mountInfos });
  }

  public toJSON(): IMountDirectoriesObject {
    const { mountInfos } = this;
    return { mountInfos } ;
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

  // TODO: Get UserInfo from UserManager and generate userGroups
  let userGroups = ["g1", "g2"];

  // Servers that current user has permission to use
  let serverNames: string[] = [];

  const [groups, groupsError] = usePromise<any[]>(() => {
    const responseToData = (response: Response) => {
      if (response.ok) {
        return response.json().then((responseData) => responseData.data);
      } else {
        throw Error(`HTTP ${response.status}`);
      }
    };

    const storageGroupUrl = `${api}/api/v1/kubernetes/api/v1/namespaces/default/secrets/storage-group`;
    return Promise.all([
      fetch(storageGroupUrl).then(responseToData),
    ]).then(([storageGroupData]) => {
      let groups = [{"gpn": "None"}];

      for (let groupName of userGroups) {
        try {
          if (!(groupName in storageGroupData)) {
            continue;
          }

          const groupContent = JSON.parse(atob(storageGroupData[groupName]));
          groups.push(groupContent);
          if (groupContent.servers != undefined) {
            serverNames.concat(groupContent.servers);
          }
        } catch (e) {
          // ignored
        }
      }
      return groups;
    });
  }, []);


  const [serverDict, serverError] = usePromise<{ [spn: string]: any }>(() => {
    const responseToData = (response: Response) => {
      if (response.ok) {
        return response.json().then((responseData) => responseData.data);
      } else {
        throw Error(`HTTP ${response.status}`);
      }
    };

    const storageServerUrl = `${api}/api/v1/kubernetes/api/v1/namespaces/default/secrets/storage-server`;
    const storageUserUrl = `${api}/api/v1/kubernetes/api/v1/namespaces/default/secrets/storage-user`;
    return Promise.all([
      fetch(storageServerUrl).then(responseToData),
      fetch(storageUserUrl).then(responseToData),
    ]).then(([storageServerData, storageUserData]) => {
      // Get servers
      if (`${user}` in storageUserData) {
        try {
          const userContent = JSON.parse(atob(storageUserData[`${user}`]));
          if (userContent.servers != undefined) {
            serverNames.concat(userContent.servers);
          }
        } catch (e) {
          // ignored
        }
      }

      let serverDict: { [spn: string]: any } = {};
      for (let serverName of serverNames) {
        if (!(serverName in serverDict) && (serverName in storageServerData)) {
          try {
            const serverContent = JSON.parse(atob(storageServerData[serverName]));
            serverDict[serverName] = serverContent;  
          } catch (e) {
            //ignored
          }
        }
      }

      return serverDict;
    });
  }, []);


  const [groupSel, onGroupSelChanged, setGroupSel] = useValue("None");
  const [mountInfos, onMountInfosChanged, setMountInfos] = useValue([]);

  const mountDirectories = useMemo(() => {
    if (serverDict == undefined || Object.keys(serverDict).length == 0 || groups == undefined) {
      return null;
    }
    return new MountDirectories(user, jobName, groups, serverDict, groupSel, mountInfos);
  }, [user, jobName, groups, serverDict, groupSel, mountInfos]);

  useEffect(() => {
    if (mountDirectories !== null) {
      onChange(mountDirectories);
    }
  }, [mountDirectories]);

  if (groupsError !== undefined || serverError !== undefined) {
    const link = "https://github.com/Microsoft/pai/wiki/Simplified-Job-Submission-for-OpenPAI-with-NFS-deployment";
    return (
      <div className="alert alert-warning" role="alert">
        NAS had not yet configured, please contact your IT Admin to set up the NAS.<br/>
        Refer to the wiki for more information:<br/>
        <a href={link} target="_blank">{link}</a>
      </div>
    );
  }

  if (mountDirectories === null) { return null; }

  return (
    <div className="form-group">
      <label>Mount Directories</label>
      <select className="form-control" id="group-select" value={groupSel} onChange={onGroupSelChanged}>
        {mountDirectories.groups.map(({ gpn, mountInfos }) => <option key={gpn} value={mountInfos}>{gpn}</option>)}
      </select>
      <table className="table">
        <thead>
          <tr>
            <th/>
            <th>Path inside container</th>
            <th>Path on storage server</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th><label htmlFor="work-path">Work Path</label></th>
            <td><code>/work</code></td>
            <td>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
