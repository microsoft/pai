import {isNil} from 'lodash';

export class ContainerSize {
  constructor(props) {
    const {cpu, memoryMB, gpu, shmMB} = props;
    this.cpu = cpu || 4;
    this.memoryMB = memoryMB || 8192;
    this.gpu = gpu || 0;
    this.shmMB = shmMB;
  }

  static isUseDefaultValue(containerSize) {
    const {cpu, memoryMB, gpu, shmMB} = containerSize;
    return (cpu == 4 && memoryMB == 8192 && gpu == 0 && isNil(shmMB));
  }

  getResourcePerInstance() {
    return {
      cpu: this.cpu,
      memoryMB: this.memoryMB,
      gpu: this.gpu,
    };
  }

  getExtraContainerOptions() {
    if (!this.shmMB) {
      return;
    }
    return {
      shmMB: this.shmMB,
    };
  }

  getResetContainerSize() {
    return new ContainerSize({gpu: this.gpu, cpu: 4, memoryMB: 8192});
  }
}
