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

interface ITensorflowSingleNodeJobObject {
  readonly type: "tensorflow-single-task";
  readonly image: string;
  readonly virtualCluster: string;
  readonly gpuNumber: number;
  readonly command: string;
  readonly mountDirectories: IMountDirectoriesObject;
}

export default class TensorflowSingleNodeJob extends Job {
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
    paiTaskRole.name = "train";
    paiTaskRole.taskNumber = 1;
    paiTaskRole.cpuNumber = this.gpuNumber * CPU_PER_GPU;
    paiTaskRole.memoryMB = this.gpuNumber * MEMORY_PER_GPU;
    paiTaskRole.gpuNumber = this.gpuNumber;
    paiTaskRole.command = this.getPaiCommand();

    const paiJob = Object.create(null);
    paiJob.jobName = this.name;
    paiJob.image = this.image;
    paiJob.virtualCluster = this.virtualCluster;
    paiJob.taskRoles = [paiTaskRole];

    return paiJob;
  }

  public toJSON() {
    const {image, virtualCluster, gpuNumber, command, mountDirectories} = this;
    return {
      type: "tensorflow-single-task",
      image,
      virtualCluster,
      gpuNumber,
      command,
      mountDirectories: mountDirectories !== null ? mountDirectories.toJSON() : null,
    } as ITensorflowSingleNodeJobObject;
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
  defaultValue: ITensorflowSingleNodeJobObject | null;
  onChange(job: TensorflowSingleNodeJob): void;
}

export function TensorflowSingleNodeJobForm({ name, image, virtualCluster, defaultValue, onChange }: IProps) {
  const [gpuNumber, onGpuNumberChanged] = useNumericValue(get(defaultValue, "gpuNumber", 1));
  // tslint:disable:max-line-length
  const [command, onCommandChanged] = useValue(get(defaultValue, "command", `
git clone https://github.com/tensorflow/models
cd models/research/slim
python download_and_convert_data.py --dataset_name=cifar10 --dataset_dir=/data
python train_image_classifier.py --batch_size=64 --model_name=inception_v3 --dataset_name=cifar10 --dataset_split_name=train --dataset_dir=/data --train_dir=/work
  `.trim()));
  // tslint:enable:max-line-length
  const [mountDirectories, setMountDirectories] = useState<MountDirectories | null>(null);

  useEffect(() => {
    onChange(new TensorflowSingleNodeJob(name, image, virtualCluster, gpuNumber, command, mountDirectories));
  }, [name, image, virtualCluster, gpuNumber, command, mountDirectories]);

  return (
    <>
      <div className="form-group">
        <label htmlFor="gpu-number">
          <span className="text-danger">*</span> GPU Number
        </label>
        <div className="row">
          <div className="col-sm-1">
            <input
              type="number"
              className="form-control"
              id="gpu-number"
              min="1"
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
        <textarea className="form-control" id="command" rows={10} value={command} onChange={onCommandChanged}/>
      </div>
      <hr/>
      <MountDirectoriesForm
        jobName={name}
        defaultValue={get(defaultValue, "mountDirectories", null) || null}
        onChange={setMountDirectories}
      />
    </>
  );
}
