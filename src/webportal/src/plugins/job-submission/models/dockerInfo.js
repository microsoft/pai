export class DockerInfo {

  constructor() {
    this.name;
    this.uri;
    this.auth;
  }

  convertToProtocolFormat() {
    return {name: this.name, type: 'dockerimage', auth: this.auth, uri: this.uri};
  }
}