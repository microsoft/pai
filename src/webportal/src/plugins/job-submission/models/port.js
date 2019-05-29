class Port {
  constructor() {
    this.key;
    this.value;
  }

  convertToProtocolFormat() {
    let port = {};
    port[this.key] = this.value;

    return port;
  }
}