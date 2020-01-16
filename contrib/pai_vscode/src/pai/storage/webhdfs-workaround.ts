/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */

import * as fs from 'fs-extra';
import * as request from 'request';
import * as requestPromise from 'request-promise-native';
import * as webhdfs from 'webhdfs';

interface IWebHDFSOptions {
    host: string;
    port?: string;
    user?: string;
    path?: string;
}

interface IWebHDFSOptions2 {
    timeout?: number;
}

export interface IHDFSStatResult {
    pathSuffix: string;
    permission: string;
    accessTime: number;
    modificationTime: number;
    length: number;
    type: 'DIRECTORY' | 'FILE';
}

export interface IHDFSClient {
    mkdir(path: string, mode?: string): Promise<void>;
    readdir(path: string): Promise<IHDFSStatResult[]>;
    stat(path: string): Promise<IHDFSStatResult>;
    unlink(path: string, recursive: boolean): Promise<void>;
    rename(from: string, to: string): Promise<void>;
    createReadStream(path: string): fs.ReadStream;
    createWriteStream(path: string): fs.WriteStream;
    createRobustWriteStream(path: string): Promise<request.Request>;
    _getOperationEndpoint(operation: string, path: string, options: object): string;
}

export function createWebHDFSClient({ host, port = '50070', user, path = '/webhdfs/v1' }: IWebHDFSOptions,
                                    { timeout = 60 * 1000 }: IWebHDFSOptions2): IHDFSClient {
    const client: IHDFSClient = webhdfs.createClient({ host, port, user, path }, { timeout });

    client.createRobustWriteStream = async function (this: IHDFSClient, pathOnWebhdfs: string): Promise<request.Request> {
        const endpoint: string = this._getOperationEndpoint('create', pathOnWebhdfs, {
            overwrite: true,
            permission: '0755'
        });
        try {
            const redirectResponse: requestPromise.FullResponse = await requestPromise.put({
                url: endpoint,
                followAllRedirects: false,
                resolveWithFullResponse: true,
                simple: false
            });
            const realLocation: string | undefined = redirectResponse.headers.location;
            if (!realLocation || redirectResponse.statusCode !== 307) {
                throw new Error('Malformed webhdfs response');
            }
            const stream: request.Request = request.put(realLocation);
            stream.once('response', (resp: request.Response) => {
                if (resp.statusCode === 201) {
                    stream.emit('finish');
                } else {
                    stream.emit('error', resp.statusMessage);
                }
            });
            return stream;
        } catch (ex) {
            throw ex;
        }
    };
    return client;
}