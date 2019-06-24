import {isNil} from 'lodash';

export class ContainerSize {
  constructor(props) {
    const {cpu, memoryMB, gpu, shmMB} = props;
    this.cpu = cpu || 4;
    this.memoryMB = memoryMB || 8192;
    this.gpu = gpu || 1;
    this.shmMB = shmMB;
  }

  static isUseDefaultValue(containerSize) {
    const {cpu, memoryMB, gpu, shmMB} = containerSize;
    let gpuCounter = Number(gpu);
    if (gpuCounter <= 0) {
      return false;
    }
    return (
      Number(cpu) / gpuCounter == 4 &&
      Number(memoryMB) / gpuCounter == 8192 &&
      isNil(shmMB)
    );
  }

  static fromProtocol(containerSizeProtocol) {
    const {resourcePerInstance, extraContainerOptions} = containerSizeProtocol;
    return new ContainerSize({...resourcePerInstance, ...extraContainerOptions});
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
