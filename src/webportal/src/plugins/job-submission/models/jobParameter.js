class JobParameter {
  constructor() {
    this.key;
    this.value;
  }

  convertToProtocolFormat() {
    let parameter = {};
    parameter[this.key] = this.value;
    return parameter
  }
}