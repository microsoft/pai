export interface IEnvironmentVariable {
  name: string;
  value: string;
}

export interface ISimpleJob {
  name: string;
  gpus: number;

  image: string;
  command: string;

  isInteractive: boolean;
  interactivePorts: string;

  enableTensorboard: boolean;
  tensorboardModelPath: string;

  enableWorkMount: boolean;
  workPath: string;
  enableDataMount: boolean;
  dataPath: string;
  enableJobMount: boolean;
  jobPath: string;

  hyperParameterName: string;
  hyperParameterStartValue: number;
  hyperParameterEndValue: number;
  hyperParameterStep: number;

  environmentVariables: IEnvironmentVariable[];

  isPrivileged: boolean;
  cpus: number;
  memory: number;
}

export default class SimpleJob implements ISimpleJob {
  public readonly name: string = "";
  public readonly gpus: number = 0;

  public readonly image: string = "";
  public readonly command: string = "";

  public readonly isInteractive: boolean = false;
  public readonly interactivePorts: string = "";

  public readonly enableTensorboard: boolean = false;
  public readonly tensorboardModelPath: string = "";

  public readonly enableWorkMount: boolean = false;
  public readonly workPath: string = "";
  public readonly enableDataMount: boolean = false;
  public readonly dataPath: string = "";
  public readonly enableJobMount: boolean = false;
  public readonly jobPath: string = "";

  public readonly hyperParameterName: string = "";
  public readonly hyperParameterStartValue: number = 0;
  public readonly hyperParameterEndValue: number = 0;
  public readonly hyperParameterStep: number = 0;

  public readonly environmentVariables: IEnvironmentVariable[] = [];

  public readonly isPrivileged: boolean = false;
  public readonly cpus: number = 1;
  public readonly memory: number = 256;

  public set<
    F extends keyof ISimpleJob,
    V extends ISimpleJob[F],
  >(field: F, value: V) {
    const that = Object.create(SimpleJob.prototype) as SimpleJob;
    Object.assign(that, this);
    that[field] = value;
    return that;
  }
}
