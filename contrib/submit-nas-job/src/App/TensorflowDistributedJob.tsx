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

const CPU_PER_GPU = 5;
const MEMORY_PER_GPU = 50 * 1024;

interface ITensorflowDistributedJobObject {
  readonly type: "tensorflow-distributed";
  readonly psNumber: number;
  readonly image: string;
  readonly virtualCluster: string;
  readonly psGpuNumber: number;
  readonly psCommand: string;
  readonly workerNumber: number;
  readonly workerGpuNumber: number;
  readonly workerCommand: string;
  readonly mountDirectories: IMountDirectoriesObject | null;
}

export default class TensorflowDistributedJob extends Job {
  public constructor(
    private readonly name: string,
    private readonly image: string,
    private readonly virtualCluster: string,
    private readonly psNumber: number,
    private readonly psGpuNumber: number,
    private readonly psCommand: string,
    private readonly workerNumber: number,
    private readonly workerGpuNumber: number,
    private readonly workerCommand: string,
    public readonly mountDirectories: MountDirectories | null,
  ) {
    super();
  }

  public convert() {
    const paiPsTaskRole = Object.create(null);
    paiPsTaskRole.name = "ps_server";
    paiPsTaskRole.taskNumber = this.psNumber;
    paiPsTaskRole.cpuNumber = this.psGpuNumber * CPU_PER_GPU;
    paiPsTaskRole.memoryMB = this.psGpuNumber * MEMORY_PER_GPU;
    paiPsTaskRole.gpuNumber = this.psGpuNumber;
    paiPsTaskRole.command = this.getPaiCommand(this.psCommand);

    const paiWorkerTaskRole = Object.create(null);
    paiWorkerTaskRole.name = "worker";
    paiWorkerTaskRole.taskNumber = this.workerNumber;
    paiWorkerTaskRole.cpuNumber = this.workerGpuNumber * CPU_PER_GPU;
    paiWorkerTaskRole.memoryMB = this.workerGpuNumber * MEMORY_PER_GPU;
    paiWorkerTaskRole.gpuNumber = this.workerGpuNumber;
    paiWorkerTaskRole.command = this.getPaiCommand(this.workerCommand);
    paiWorkerTaskRole.minSucceededTaskCount = this.workerNumber;

    const paiJob = Object.create(null);
    paiJob.jobName = this.name;
    paiJob.image = this.image;
    paiJob.virtualCluster = this.virtualCluster;
    paiJob.taskRoles = [paiPsTaskRole, paiWorkerTaskRole];
    paiJob.retryCount = 0;

    return paiJob;
  }

  public toJSON(): ITensorflowDistributedJobObject {
    const {
      image,
      virtualCluster,
      psNumber,
      psGpuNumber,
      psCommand,
      workerNumber,
      workerGpuNumber,
      workerCommand,
      mountDirectories,
    } = this;

    return {
      type: "tensorflow-distributed",
      image,
      virtualCluster,
      psNumber,
      psGpuNumber,
      psCommand,
      workerNumber,
      workerGpuNumber,
      workerCommand,
      mountDirectories: mountDirectories !== null ? mountDirectories.toJSON() : null,
    };
  }

  private getPaiCommand(command: string) {
    const commands: string[] = [];

    if (this.mountDirectories !== null) {
      commands.push(this.mountDirectories.getPaiCommand());
    }

    commands.push(command.split("\n").join(" && "));

    return commands.join(" && ");
  }
}

interface IProps {
  name: string;
  image: string;
  virtualCluster: string;
  defaultValue: ITensorflowDistributedJobObject | null;
  onChange(job: TensorflowDistributedJob): void;
}

export function TensorflowDistributedJobForm({ name, image, virtualCluster, defaultValue, onChange }: IProps) {
  const [psNumber, onPsNumberChanged] = useNumericValue(get(defaultValue, "psNumber", 1));
  const [psGpuNumber, onPsGpuNumberChanged] = useNumericValue(get(defaultValue, "psGpuNumber", 1));
  // tslint:disable:max-line-length
  const [psCommand, onPsCommandChanged] = useValue(get(defaultValue, "psCommand", `
echo "This is a parameter server."
echo "All parameter servers are: $PAI_TASK_ROLE_ps_server_HOST_LIST"
echo "All workers are: $PAI_TASK_ROLE_worker_HOST_LIST"
  `.trim()));
  // tslint:enable:max-line-length

  const [workerNumber, onWorkerNumberChanged] = useNumericValue(get(defaultValue, "workerNumber", 1));
  const [workerGpuNumber, onWorkerGpuNumberChanged] = useNumericValue(get(defaultValue, "workerGpuNumber", 1));
  // tslint:disable:max-line-length
  const [workerCommand, onWorkerCommandChanged] = useValue(get(defaultValue, "workerCommand", `
echo "This is a worker."
echo "All parameter servers are: $PAI_TASK_ROLE_ps_server_HOST_LIST"
echo "All workers are: $PAI_TASK_ROLE_worker_HOST_LIST"
  `.trim()));
  // tslint:enable:max-line-length

  const [mountDirectories, setMountDirectories] = useState<MountDirectories | null>(null);

  useEffect(() => {
    onChange(new TensorflowDistributedJob(
      name,
      image,
      virtualCluster,
      psNumber,
      psGpuNumber,
      psCommand,
      workerNumber,
      workerGpuNumber,
      workerCommand,
      mountDirectories,
    ));
  }, [
    name,
    image,
    virtualCluster,
    psNumber,
    psGpuNumber,
    psCommand,
    workerNumber,
    workerGpuNumber,
    workerCommand,
    mountDirectories,
  ]);

  return (
    <>
      <h3><span className="text-danger">*</span> Parameter Servers</h3>
        <div className="container-fluid">
          <div className="row">&nbsp;</div>
          <div className="row">
            <div className="col-sm-2">
              <span className="text-danger">*</span> Server Number
            </div>
            <div className="col-sm-1">
              <input
                type="number"
                className="form-control"
                id="ps-number"
                min="1"
                value={psNumber}
                onChange={onPsNumberChanged}
              />
            </div>
          </div>
          <div className="row">&nbsp;</div>
          <div className="row">
            <div className="col-sm-2">
              <span className="text-danger">*</span> GPU Number Per Server
            </div>
            <div className="col-sm-1">
              <input
                type="number"
                className="form-control"
                id="ps-gpu-number"
                min="1"
                value={psGpuNumber}
                onChange={onPsGpuNumberChanged}
              />
            </div>
          </div>
          <div className="row">&nbsp;</div>
          <div className="row">
            <div className="col-sm-2">
              <span className="text-danger">*</span> Server Command
            </div>
            <div className="col-sm-4">
            <textarea
              className="form-control"
              id="command"
              rows={10}
              value={psCommand}
              onChange={onPsCommandChanged}
            />
            </div>
          </div>
        </div>
      <hr/>

      <h3><span className="text-danger">*</span> Workers</h3>
      <div className="container-fluid">
        <div className="row">&nbsp;</div>
          <div className="row">
            <div className="col-sm-2">
              <span className="text-danger">*</span> Worker Number
            </div>
            <div className="col-sm-1">
              <input
                type="number"
                className="form-control"
                id="worker-number"
                min="1"
                value={workerNumber}
                onChange={onWorkerNumberChanged}
              />
            </div>
          </div>
          <div className="row">&nbsp;</div>
          <div className="row">
            <div className="col-sm-2">
              <span className="text-danger">*</span> GPU Number Per Worker
            </div>
            <div className="col-sm-1">
              <input
                type="number"
                className="form-control"
                id="ps-gpu-number"
                min="1"
                value={workerGpuNumber}
                onChange={onWorkerGpuNumberChanged}
              />
            </div>
          </div>
          <div className="row">&nbsp; </div>
          <div className="row">
            <div className="col-sm-2">
              <span className="text-danger">*</span> Worker Command
            </div>
            <div className="col-sm-4">
            <textarea
              className="form-control"
              id="command"
              rows={10}
              value={workerCommand}
              onChange={onWorkerCommandChanged}
            />
            </div>
          </div>
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
