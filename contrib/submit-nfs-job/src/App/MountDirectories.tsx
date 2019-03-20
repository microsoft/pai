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

import { join } from "path";

import Context from "./Context";
import { usePromise, useValue } from "./hooks";
import { getProp } from "./utils";

export interface IMountDirectoriesObject {
  readonly workPath: string;
  readonly dataPath: string;
  readonly jobPath: string;
}

export default class MountDirectories {
  constructor(
    private readonly nfsRoot: string,
    private readonly user: string,
    private readonly jobName: string,

    private readonly workPath: string,
    private readonly dataPath: string,
    private readonly jobPath: string,
  ) {}

  private get normalizedWorkPath() {
    return join("/", this.workPath, "/");
  }
  private get normalizedDataPath() {
    return join("/", this.dataPath, "/");
  }
  private get normalizedJobPath() {
    return join("/", this.jobPath, "/");
  }

  public get nfsUserRoot() {
    return join(this.nfsRoot, "users", this.user, "/");
  }
  public get nfsDataRoot() {
    return join(this.nfsRoot, "data", "/");
  }

  public getPaiCommand() {
    return [
      // Install NFS
      "apt-get update",
      "apt-get install --assume-yes nfs-common",

      // Make local directories.
      "mkdir --parents /work /data /job /mnt/nfs",

      // Make remove (NFS) work & job directories
      `mount -t nfs4 ${this.nfsUserRoot} /mnt/nfs`,
      `mkdir --parents ${join("/mnt/nfs", this.normalizedWorkPath)}`,
      `mkdir --parents ${join("/mnt/nfs", this.normalizedJobPath, this.jobName)}`,
      "umount /mnt/nfs",

      // Mount all directories
      `mount -t nfs4 ${join(this.nfsUserRoot, this.normalizedWorkPath)} /work`,
      `mount -t nfs4 ${join(this.nfsDataRoot, this.normalizedDataPath)} /data`,
      `mount -t nfs4 ${join(this.nfsUserRoot, this.normalizedJobPath, this.jobName)} /job`,
    ].join(" && ");
  }

  public applyJSON({ workPath, dataPath, jobPath }: IMountDirectoriesObject) {
    Object.assign(this, { workPath, dataPath, jobPath });
  }

  public toJSON(): IMountDirectoriesObject {
    const { workPath, dataPath, jobPath } = this;
    return { workPath, dataPath, jobPath } ;
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
  const [workPath, onWorkPathChanged] = useValue(getProp(defaultValue, "workPath", "work"));
  const [dataPath, onDataPathChanged] = useValue(getProp(defaultValue, "dataPath", ""));
  const [jobPath, onJobPathChanged] = useValue(getProp(defaultValue, "jobPath", "jobs"));

  const { api, user } = useContext(Context);

  const [nfsRoot, nfsRootError] = usePromise<string>(() => {
    const responseToData = (response: Response) => {
      if (response.ok) {
        return response.json().then((responseData) => responseData.data);
      } else {
        throw Error(`HTTP ${response.status}`);
      }
    };

    const storageExternalUrl = `${api}/api/v1/kubernetes/api/v1/namespaces/default/configmaps/storage-external`;
    const storageUserUrl = `${api}/api/v1/kubernetes/api/v1/namespaces/default/configmaps/storage-user`;
    return Promise.all([
      fetch(storageExternalUrl).then(responseToData),
      fetch(storageUserUrl).then(responseToData),
    ]).then(([storageExternalData, storageUserData]) => {
      let storageKey = "default.json";
      try {
        const content = storageUserData[`${user}.json`];
        const { defaultStorage } = JSON.parse(content);
        if (typeof defaultStorage === "string" && defaultStorage.length > 0) {
          storageKey = defaultStorage;
        }
      } catch (e) {
        // ignored
      }

      const storageContent = storageExternalData[storageKey];
      const { type, address, rootPath } = JSON.parse(storageContent);
      if (type !== "nfs") {
        throw Error(`Unknown storage type ${type}`);
      }

      return `${address}:${rootPath}`;
    });
  }, []);

  const mountDirectories = useMemo(() => {
    if (nfsRoot === undefined) {
      return null;
    }
    return new MountDirectories(nfsRoot, user, jobName, workPath, dataPath, jobPath);
  }, [nfsRoot, user, jobName, workPath, dataPath, jobPath]);

  useEffect(() => {
    if (mountDirectories !== null) {
      onChange(mountDirectories);
    }
  }, [mountDirectories]);

  if (nfsRootError !== undefined) {
    const link = "https://github.com/Microsoft/pai/wiki/Simplified-Job-Submission-for-OpenPAI-with-NFS-deployment";
    return (
      <div className="alert alert-warning" role="alert">
        NFS had not yet configured, please contact your IT Admin to set up the NFS.<br/>
        Refer to the wiki for more information:<br/>
        <a href={link} target="_blank">{link}</a>
      </div>
    );
  }

  if (mountDirectories === null) { return null; }

  return (
    <div className="form-group">
      <label>Mount Directories</label>
      <table className="table">
        <thead>
          <tr>
            <th/>
            <th>Path inside container</th>
            <th>Path storage server</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th><label htmlFor="work-path">Work Path</label></th>
            <td><code>/work</code></td>
            <td>
              <div className="input-group">
                <span className="input-group-addon">{mountDirectories.nfsUserRoot}</span>
                <input
                  type="text"
                  className="form-control"
                  id="work-path"
                  value={workPath}
                  onChange={onWorkPathChanged}
                />
              </div>
            </td>
          </tr>
          <tr>
            <th><label htmlFor="data-path">Data Path</label></th>
            <td><code>/data</code></td>
            <td>
              <div className="input-group">
                <span className="input-group-addon">{mountDirectories.nfsDataRoot}</span>
                <input
                  type="text"
                  className="form-control"
                  id="data-path"
                  value={dataPath}
                  onChange={onDataPathChanged}
                />
              </div>
            </td>
          </tr>
          <tr>
            <th><label htmlFor="job-path">Job Path</label></th>
            <td><code>/job</code></td>
            <td>
              <div className="input-group">
                <span className="input-group-addon">{mountDirectories.nfsUserRoot}</span>
                <input
                  type="text"
                  className="form-control"
                  id="job-path"
                  value={jobPath}
                  onChange={onJobPathChanged}
                />
                <span className="input-group-addon">{join("/", jobName)}</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
