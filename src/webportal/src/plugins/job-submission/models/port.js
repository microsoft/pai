export class Port {
  constructor() {
    this.portLabel;
    this.portNumber;
  }

  convertToProtocolFormat() {
    let port = {};
    port[this.portLabel] = this.portNumber;

    return port;
  }
}