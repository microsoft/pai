import * as webhdfs from 'webhdfs';
import {promisify} from 'util';

export class WebHDFSClient {
  constructor(host, user, timeout, port = '80', path = `/webhdfs/api/v1`) {
    this.host = `http://${host}:${port}`;
    this.endpoint = `http://${host}:${port}${path}`;
    this.client = webhdfs.createClient({host, port, user, path}, {timeout});
    this.client.readdir = promisify(this.client.readdir);
    this.client.mkdir = promisify(this.client.mkdir);
  }

  async checkAccess() {
    return this.client
      .readdir('/')
      .then(() => {
        return true;
      })
      .catch((error) => {
        return false;
      });
  }

  async ensureDir(path) {
    this.client
      .readdir(path)
      .then((data) => {
      })
      .catch((error) => {
        if (error.message.includes('does not exist')) {
          this.client.mkdir(path);
        } else {
          throw error;
        }
      });
  }

  async readDir(path) {
    return this.client
      .readdir(path)
      .then((data) => data.map((item) => item.pathSuffix));
  }

  async uploadFile(dir, file, newFileName = file.name) {
    try {
      await this.client.readdir(dir);
    } catch (e) {
      await this.client.mkdir(dir);
    }

    const res = await fetch(
      `${
        this.endpoint
      }${dir}/${newFileName}?op=create&overwrite=true&permission=0755`,
      {
        method: 'put',
        redirect: 'manual',
      },
    );
    const location = res.url;
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onloadend = () => {
        const fileBinary = reader.result;
        fetch(location, {
          method: 'put',
          headers: {'Content-Type': 'application/octet-stream'},
          body: fileBinary,
        })
          .then(() => {
            resolve(`${dir}/${newFileName}`);
          })
          .catch((err) => {
            reject(err);
          });
      };
      reader.readAsBinaryString(file);
    });
  }
}
