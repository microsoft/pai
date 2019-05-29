import { DockerInfo } from "./dockerInfo";

export class JobTaskRole {

  constructor() {
    this.name;
    this.instances;
    this.taskRetryCount;
    this.dockerInfo = new DockerInfo();
    this.ports = [];
  }

  getTaskPrerequires() {
  }

  convertToProtocolFormat() {
  }
}