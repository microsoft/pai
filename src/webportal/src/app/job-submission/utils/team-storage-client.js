export class TeamStorageClient {
  constructor(api, user, token) {
    this.userInfoUrl = `${api}/api/v2/user/${user}`;
    this.storageConfigUrl = `${api}/api/v1/kubernetes/api/v1/namespaces/pai-storage/secrets/storage-config`;
    this.storageServerUrl = `${api}/api/v1/kubernetes/api/v1/namespaces/pai-storage/secrets/storage-server`;
    this.token = token;
  }

  async fetchUserGroup() {
    return fetch(this.userInfoUrl, {
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    }).then((response) => {
      if (response.ok) {
        response.json().then((responseData) => responseData.grouplist);
      } else {
        throw Error(`fetch ${this.userInfoUrl}: HTTP ${response.status}`);
      }
    });
  }

  async fetchStorageConfigData(path) {
    return fetch(this.storageConfigUrl).then((response) => {
      if (response.ok) {
        response.json().then((responseData) => responseData.data);
      } else {
        throw Error(`fetch ${this.storageConfigUrl}: HTTP ${response.status}`);
      }
    });
  }

  async fetchStorageServer() {
    return fetch(this.storageServerUrl).then((response) => {
      if (response.ok) {
        response.json().then((responseData) => responseData.data);
      } else {
        throw Error(`fetch ${this.storageServerUrl}: HTTP ${response.status}`);
      }
    });
  }
}
