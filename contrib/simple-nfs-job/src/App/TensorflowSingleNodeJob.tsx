import React, { useEffect, useState } from "react";

import { useNumericValue, useValue } from "./hooks";
import Job from "./Job";
import MountDirectories, { IMountDirectoriesObject, MountDirectoriesForm } from "./MountDirectories";
import { getProp } from "./utils";

const CPU_PER_GPU = 5;
const MEMORY_PER_GPU = 50 * 1024;

interface ITensorflowSingleNodeJobObject {
  readonly type: "tensorflow-single-node";
  readonly gpuNumber: number;
  readonly command: string;
  readonly mountDirectories: IMountDirectoriesObject;
}

export default class TensorflowSingleNodeJob extends Job {
  public constructor(
    private readonly name: string,
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
    paiJob.name = this.name;
    paiJob.image = "openpai/pai.example.tensorflow:stable";
    paiJob.virtualCluster = "default";
    paiJob.taskRoles = [paiTaskRole];

    return paiJob;
  }

  public toJSON() {
    const {gpuNumber, command, mountDirectories} = this;
    return {
      type: "tensorflow-single-node",
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
  defaultValue: ITensorflowSingleNodeJobObject | null;
  onChange(job: TensorflowSingleNodeJob): void;
}

export function TensorflowSingleNodeJobForm({ name, defaultValue, onChange }: IProps) {
  const [gpuNumber, onGpuNumberChanged] = useNumericValue(getProp(defaultValue, "gpuNumber", 1));
  // tslint:disable:max-line-length
  const [command, onCommandChanged] = useValue(getProp(defaultValue, "command", `
git clone https://github.com/tensorflow/models
cd models/research/slim
python download_and_convert_data.py --dataset_name=cifar10 --dataset_dir=/data
python train_image_classifier.py --batch_size=64 --model_name=inception_v3 --dataset_name=cifar10 --dataset_split_name=train --dataset_dir=/data --train_dir=/work
  `.trim()));
  // tslint:enable:max-line-length
  const [mountDirectories, setMountDirectories] = useState<MountDirectories | null>(null);

  useEffect(() => {
    onChange(new TensorflowSingleNodeJob(name, gpuNumber, command, mountDirectories));
  }, [name, gpuNumber, command, mountDirectories]);

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
        defaultValue={getProp(defaultValue, "mountDirectories", null) || null}
        onChange={setMountDirectories}
      />
    </>
  );
}
