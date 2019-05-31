export class Port {
  constructor(portLabel, portNumber) {
    this.portLabel = portLabel;
    this.portNumber = portNumber;
  }

  convertToProtocolFormat() {
    let port = {};
    port[this.portLabel] = this.portNumber;

    return port;
  }
}