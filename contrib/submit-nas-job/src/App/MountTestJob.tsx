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
import React, { useEffect, useState } from "react";

import get from "lodash.get";

import { useNumericValue, useValue } from "./hooks";
import Job from "./Job";
import MountDirectories, { IMountDirectoriesObject, MountDirectoriesForm } from "./MountDirectories";

interface IMountTestJobObject {
  readonly type: "mount-test-task";
  readonly image: string;
  readonly virtualCluster: string;
  readonly gpuNumber: number;
  readonly command: string;
  readonly mountDirectories: IMountDirectoriesObject | null;
}

export default class MountTestJob extends Job {
  public constructor(
    private readonly name: string,
    private readonly image: string,
    private readonly virtualCluster: string,
    private readonly gpuNumber: number,
    private readonly command: string,
    public readonly mountDirectories: MountDirectories | null,
  ) {
    super();
  }

  public convert() {
    const paiTaskRole = Object.create(null);
    paiTaskRole.name = "master";
    paiTaskRole.taskNumber = 1;
    paiTaskRole.cpuNumber = 1;
    paiTaskRole.memoryMB = 4 * 1024;
    paiTaskRole.gpuNumber = this.gpuNumber;
    paiTaskRole.command = this.getPaiCommand();

    const paiJob = Object.create(null);
    paiJob.jobName = this.name;
    paiJob.image = this.image;
    paiJob.virtualCluster = this.virtualCluster;
    paiJob.taskRoles = [paiTaskRole];

    return paiJob;
  }

  public toJSON(): IMountTestJobObject {
    const { image, virtualCluster, gpuNumber, command, mountDirectories } = this;
    return {
      type: "mount-test-task",
      image,
      virtualCluster,
      gpuNumber,
      command,
      mountDirectories: mountDirectories !== null ? mountDirectories.toJSON() : null,
    };
  }

  private getPaiCommand() {
    const commands: string[] = [];

    if (this.mountDirectories !== null) {
      commands.push(this.mountDirectories.getPaiCommand());
    }

    commands.push(this.command.split("\n").join(" && "));

    return commands.join(" && ");
  }
}

interface IProps {
  name: string;
  image: string;
  virtualCluster: string;
  defaultValue: IMountTestJobObject | null;
  onChange(job: MountTestJob): void;
}

export function MountTestJobForm({ name, image, virtualCluster, defaultValue, onChange }: IProps) {
  const [gpuNumber, onGpuNumberChanged] = useNumericValue(get(defaultValue, "gpuNumber", 0));
  const [command, onCommandChanged] = useValue(get(defaultValue,
    "command", "for i in ${MOUNTPOINTS[@]}; do echo $i; ls -l $i; echo ''; done; sleep infinity"));
  const [mountDirectories, setMountDirectories] = useState<MountDirectories | null>(null);

  useEffect(() => {
    onChange(new MountTestJob(name, image, virtualCluster, gpuNumber, command, mountDirectories));
  }, [name, image, virtualCluster, gpuNumber, command, mountDirectories]);

  return (
    <>
      <div className="form-group">
        <label htmlFor="gpu-number">
          <span className="text-danger">*</span> GPU Number
        </label>
        <div className="row">
          <div className="col-sm-2">
            <input
              type="number"
              className="form-control"
              id="gpu-number"
              min="0"
              value={gpuNumber}
              onChange={onGpuNumberChanged}
            />
          </div>
        </div>
      </div>
      <hr/>
      <div className="form-group">
        <label htmlFor="command">
          <span className="text-danger">*</span> Command &amp; Parameter
        </label>
        <textarea
          className="form-control"
          id="command"
          rows={10}
          value={command}
          onChange={onCommandChanged}
          required={true}
        />
      </div>
      <hr/>
      <MountDirectoriesForm
        jobName={name}
        defaultValue={get(defaultValue, "mountDirectories", null)}
        onChange={setMountDirectories}
      />
    </>
  );
}
