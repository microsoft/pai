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
export interface IEnvironmentVariable {
  name: string;
  value: string;
}

export interface ISimpleJob {
  readonly name: string;
  readonly gpus: number;

  readonly image: string;
  readonly command: string;
  readonly root: boolean;
  readonly virtualCluster: string;

  readonly isInteractive: boolean;
  readonly interactivePorts: string;

  readonly enableTensorboard: boolean;
  readonly tensorboardModelPath: string;

  readonly enableWorkMount: boolean;
  readonly workPath: string;
  readonly enableDataMount: boolean;
  readonly dataPath: string;
  readonly enableJobMount: boolean;
  readonly jobPath: string;

  readonly hyperParameterName: string;
  readonly hyperParameterStartValue: number;
  readonly hyperParameterEndValue: number;
  readonly hyperParameterStep: number;

  readonly environmentVariables: IEnvironmentVariable[];

  readonly isPrivileged: boolean;
  readonly cpus: number;
  readonly memory: number;
}

export default class SimpleJob implements ISimpleJob {

  public static fromLegacyJSON(json: string) {
    const legacyObject = JSON.parse(json);
    const simpleJob = new SimpleJob();

    if (typeof legacyObject.jobName === "string") {
      simpleJob.name = legacyObject.jobName;
    }
    if (typeof legacyObject.resourcegpu === "number") {
      simpleJob.gpus = Number(legacyObject.resourcegpu) || 0;
    }

    if (typeof legacyObject.image === "string") {
      simpleJob.image = legacyObject.image;
    }
    if (typeof legacyObject.cmd === "string") {
      simpleJob.command = legacyObject.cmd;
    }
    if (typeof legacyObject.runningasroot === "boolean") {
      simpleJob.root = legacyObject.runningasroot;
    }

    if (typeof legacyObject.is_interactive === "boolean") {
      simpleJob.isInteractive = legacyObject.is_interactive;
    }
    if (simpleJob.isInteractive && typeof legacyObject.interactivePort === "string") {
      simpleJob.interactivePorts = legacyObject.interactivePort;
    }

    if (typeof legacyObject.do_log === "boolean") {
      simpleJob.enableTensorboard = legacyObject.do_log;
    }
    if (simpleJob.enableTensorboard && typeof legacyObject.logDir === "string") {
      simpleJob.tensorboardModelPath = legacyObject.logDir;
    }

    if (typeof legacyObject.enableworkpath === "boolean") {
      simpleJob.enableWorkMount = legacyObject.enableworkpath;
    }
    if (typeof legacyObject.workPath === "string") {
      simpleJob.workPath = legacyObject.workPath;
    }
    if (typeof legacyObject.enabledatapath === "boolean") {
      simpleJob.enableDataMount = legacyObject.enabledatapath;
    }
    if (typeof legacyObject.dataPath === "string") {
      simpleJob.dataPath = legacyObject.dataPath;
    }
    if (typeof legacyObject.enablejobpath === "boolean") {
      simpleJob.enableJobMount = legacyObject.enablejobpath;
    }
    if (typeof legacyObject.jobPath === "string") {
      simpleJob.jobPath = legacyObject.jobPath;
    }

    if (typeof legacyObject.hyperparametername === "string") {
      simpleJob.hyperParameterName = legacyObject.hyperparametername;
    }
    if (
      typeof legacyObject.hyperparameterstartvalue === "number" ||
      typeof legacyObject.hyperparameterstartvalue === "string"
    ) {
      simpleJob.hyperParameterStartValue = Number(legacyObject.hyperparameterstartvalue) || 0;
    }
    if (
      typeof legacyObject.hyperparameterendvalue === "number" ||
      typeof legacyObject.hyperparameterendvalue === "string"
    ) {
      simpleJob.hyperParameterEndValue = Number(legacyObject.hyperparameterendvalue) || 0;
    }
    if (
      typeof legacyObject.hyperparameterstep === "number" ||
      typeof legacyObject.hyperparameterstep === "string"
    ) {
      simpleJob.hyperParameterStep = Number(legacyObject.hyperparameterstep) || 0;
    }

    if (Array.isArray(legacyObject.env)) {
      const { environmentVariables } = simpleJob;
      for (const legacyEnv of legacyObject.env) {
        const { name, value } = legacyEnv;
        if (typeof name === "string" && typeof value === "string") {
          environmentVariables.push({ name, value });
        }
      }
    }

    if (typeof legacyObject.isPrivileged === "boolean") {
      simpleJob.isPrivileged = legacyObject.isPrivileged;
    }

    if (simpleJob.isPrivileged) {
      if (
        typeof legacyObject.cpurequest === "string" ||
        typeof legacyObject.cpurequest === "number"
      ) {
        simpleJob.cpus = Number(legacyObject.cpurequest) || 1;
      }
      if (
        typeof legacyObject.memoryrequest === "string" ||
        typeof legacyObject.memoryrequest === "number"
      ) {
        simpleJob.memory = Number(legacyObject.memoryrequest) || 256;
      }
    }

    return simpleJob;
  }

  public static toLegacyJSON(simpleJob: ISimpleJob): string {
    const legacyObject: any = {};
    legacyObject.jobName = simpleJob.name;
    legacyObject.resourcegpu = simpleJob.gpus;

    legacyObject.image = simpleJob.image;
    legacyObject.cmd = simpleJob.command;
    legacyObject.runningasroot = simpleJob.root;

    if (simpleJob.isInteractive) {
      legacyObject.is_interactive = simpleJob.isInteractive;
      legacyObject.interactivePort = simpleJob.interactivePorts;
    }

    if (simpleJob.enableTensorboard) {
      legacyObject.do_log = simpleJob.enableTensorboard;
      legacyObject.logDir = simpleJob.tensorboardModelPath;
    }

    legacyObject.enableworkpath = simpleJob.enableWorkMount;
    legacyObject.workPath = simpleJob.workPath;
    legacyObject.enabledatapath = simpleJob.enableDataMount;
    legacyObject.dataPath = simpleJob.dataPath;
    legacyObject.enablejobpath = simpleJob.enableJobMount;
    legacyObject.jobPath = simpleJob.jobPath;

    legacyObject.hyperparametername = simpleJob.hyperParameterName;
    legacyObject.hyperparameterstartvalue = simpleJob.hyperParameterStartValue;
    legacyObject.hyperparameterendvalue = simpleJob.hyperParameterEndValue;
    legacyObject.hyperparameterstep = simpleJob.hyperParameterStep;

    if (simpleJob.isPrivileged) {
      legacyObject.isPrivileged = simpleJob.isPrivileged;
      legacyObject.cpurequest = simpleJob.cpus;
      legacyObject.memoryrequest = simpleJob.memory;
    }

    return JSON.stringify(legacyObject);
  }

  public name: string = "";
  public gpus: number = 0;

  public image: string = "";
  public command: string = "";
  public root: boolean = true;
  public virtualCluster: string = "default";

  public isInteractive: boolean = false;
  public interactivePorts: string = "";

  public enableTensorboard: boolean = false;
  public tensorboardModelPath: string = "";

  public enableWorkMount: boolean = false;
  public workPath: string = "";
  public enableDataMount: boolean = false;
  public dataPath: string = "";
  public enableJobMount: boolean = false;
  public jobPath: string = "";

  public hyperParameterName: string = "";
  public hyperParameterStartValue: number = 0;
  public hyperParameterEndValue: number = 0;
  public hyperParameterStep: number = 0;

  public environmentVariables: IEnvironmentVariable[] = [];

  public isPrivileged: boolean = false;
  public cpus: number = 1;
  public memory: number = 30 * 1024;

  public constructor(that?: ISimpleJob) {
    if (that !== undefined) {
      Object.assign(this, that);
    }
  }

  public clone<
    F extends keyof ISimpleJob,
    V extends ISimpleJob[F]
  >(field?: F, value?: V): SimpleJob {
    const that = new SimpleJob(this);
    if (field !== undefined && value !== undefined) {
      that[field] = value;
    }
    return that;
  }
}
