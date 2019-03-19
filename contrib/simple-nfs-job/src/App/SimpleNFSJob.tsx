import React, { useEffect, useState } from "react";

import { useNumericValue, useValue } from "./hooks";
import Job from "./Job";
import MountDirectories, { IMountDirectoriesObject, MountDirectoriesForm } from "./MountDirectories";
import { getProp } from "./utils";

const CPU_PER_GPU = 5;
const MEMORY_PER_GPU = 50 * 1024;

interface ISimpleNFSJobObject {
  readonly type: "simple-nfs";
  readonly gpuNumber: number;
  readonly command: string;
  readonly mountDirectories: IMountDirectoriesObject | null;
}

export default class SimpleNFSJob extends Job {
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
    paiTaskRole.name = "master";
    paiTaskRole.taskNumber = 1;
    paiTaskRole.cpuNumber = this.gpuNumber * CPU_PER_GPU;
    paiTaskRole.memoryMB = this.gpuNumber * MEMORY_PER_GPU;
    paiTaskRole.gpuNumber = this.gpuNumber;
    paiTaskRole.command = this.getPaiCommand();

    const paiJob = Object.create(null);
    paiJob.jobName = this.name;
    paiJob.image = "openpai/pai.build.base:hadoop2.7.2-cuda9.0-cudnn7-devel-ubuntu16.04";
    paiJob.virtualCluster = "default";
    paiJob.taskRoles = [paiTaskRole];

    return paiJob;
  }

  public toJSON(): ISimpleNFSJobObject {
    const { gpuNumber, command, mountDirectories } = this;
    return {
      type: "simple-nfs",
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
  defaultValue: ISimpleNFSJobObject | null;
  onChange(job: SimpleNFSJob): void;
}

export function SimpleNFSJobForm({ name, defaultValue, onChange }: IProps) {
  const [gpuNumber, onGpuNumberChanged] = useNumericValue(getProp(defaultValue, "gpuNumber", 1));
  const [command, onCommandChanged] = useValue(getProp(defaultValue, "command", "echo \"Hello OpenPAI!\""));
  const [mountDirectories, setMountDirectories] = useState<MountDirectories | null>(null);

  useEffect(() => {
    onChange(new SimpleNFSJob(name, gpuNumber, command, mountDirectories));
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
        defaultValue={getProp(defaultValue, "mountDirectories", null)}
        onChange={setMountDirectories}
      />
    </>
  );
}
