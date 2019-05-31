export class DockerInfo {

  constructor(name, uri, auth) {
    this.name = name;
    this.uri = uri;
    this.auth = auth;
  }

  convertToProtocolFormat() {
    return {name: this.name, type: 'dockerimage', auth: this.auth, uri: this.uri};
  }
}