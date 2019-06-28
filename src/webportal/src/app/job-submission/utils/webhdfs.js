import * as webhdfs from 'webhdfs';
import {promisify} from 'util';

// interface HDFSStatResult {
//   pathSuffix: string
//   permission: string
//   accessTime: number
//   modificationTime: number
//   length: number
//   type: 'DIRECTORY' | 'FILE'
// }

// interface HDFSClient {
//   mkdir(path: string, mode?: string): Promise<void>
//   readdir(path: string): Promise<HDFSStatResult[]>
//   stat(path: string): Promise<HDFSStatResult>
//   unlink(path: string, recursive: boolean): Promise<void>
//   rename(from: string, to: string): Promise<void>
//   createReadStream(path: string): fs.ReadStream
//   createWriteStream(path: string): fs.WriteStream
//   writeFile(path: string, data: string, callback: Function): fs.WriteStream
//   _getOperationEndpoint(
//     operation: string,
//     path: string,
//     options: object,
//   ): string
// }

export class WebHDFSClient {
  constructor(host, user, timeout, port = '50070', apiPath = `/webhdfs/v1`) {
    this.host = `http://${host}:${port}`;
    this.endpoint = `http://${host}:${port}${apiPath}`;
    this.client = webhdfs.createClient({host, port, user, apiPath}, {timeout});
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
