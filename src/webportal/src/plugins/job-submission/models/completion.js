export class Completion {
  constructor(props) {
    const {minFailedInstances, minSuceedInstances} = props;
    this.minFailedInstances = minFailedInstances;
    this.minSuceedInstances = minSuceedInstances;
  }

  convertToProtocolFormat() {
    return {
      minFailedInstances: this.minFailedInstances,
      minSuceedInstances: this.minSuceedInstances,
    };
  }
}
