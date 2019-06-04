export class ContainerSize {
  constructor(props) {
    const {cpu, memoryMB, gpu, shmMB} = props;
    this.cpu = cpu || 4;
    this.memoryMB = memoryMB || 8192;
    this.gpu = gpu || 0;
    this.shmMB = shmMB;
  }

  convertToProtocolFormat() {
  }

  getResetContainerSize() {
    return new ContainerSize({gpu: this.gpu, cpu: 4, memoryMB: 8192});
  }
}
