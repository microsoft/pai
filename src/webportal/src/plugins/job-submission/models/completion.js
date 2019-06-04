export class Completion {
  constructor(props) {
    const {minFailedInstances, minSuceedInstances} = props;
    this.minFailedInstances = minFailedInstances || 1;
    this.minSuceedInstances = minSuceedInstances || null;
  }

  convertToProtocolFormat() {
    return {
      minFailedInstances: this.minFailedInstances,
      minSuceedInstances: this.minSuceedInstances,
    };
  }
}
