export class ContainerSize {
  constructor(props) {
    const {cpu, memoryMB, gpu, shmMB} = props;
    this.cpu = cpu === undefined? 4: cpu;
    this.memoryMB = memoryMB === undefined? 8192: memoryMB;
    this.gpu = gpu === undefined? 0: gpu;
    this.shmMB = shmMB === undefined? 0: shmMB;
  }

  convertToProtocolFormat() {
  }

  getResetContainerSize() {
    return new ContainerSize({gpu: this.gpu, cpu: 4, memoryMB: 8192, shmMB: 0});
  }
}
