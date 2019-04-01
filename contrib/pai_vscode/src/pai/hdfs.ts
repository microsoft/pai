/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */

import * as fs from 'fs-extra';
import { injectable } from 'inversify';
import * as path from 'path';
import { Request } from 'request';
import { Transform } from 'stream';
import * as streamifier from 'streamifier';
import unixify = require('unixify'); // tslint:disable-line
import { promisify } from 'util';
import * as vscode from 'vscode';

import {
    COMMAND_HDFS_DOWNLOAD, COMMAND_HDFS_UPLOAD_FILES, COMMAND_HDFS_UPLOAD_FOLDERS, COMMAND_OPEN_HDFS,
    ENUM_HDFS_EXPLORER_LOCATION, OCTICON_CLOUDUPLOAD, SETTING_HDFS_EXPLORER_LOCATION, SETTING_SECTION_HDFS
} from '../common/constants';
import { __ } from '../common/i18n';
import { getSingleton, Singleton } from '../common/singleton';
import { Util } from '../common/util';

import { ClusterManager } from './clusterManager';
import { ClusterExplorerChildNode } from './configurationTreeDataProvider';
import { HDFSTreeDataProvider } from './container/hdfsTreeView';
import { IPAICluster } from './paiInterface';
import { createWebHDFSClient, IHDFSClient, IHDFSStatResult } from './webhdfs-workaround';

const stat: (path: string) => Promise<fs.Stats> = promisify(fs.stat);
const readdir: (path: string) => Promise<string[]> = promisify(fs.readdir);
const mkdir: (path: string) => Promise<void> = fs.mkdirp;

export function getHDFSUriAuthority(configuration: IPAICluster): string {
    return `${configuration.username}@${configuration.webhdfs_uri && configuration.webhdfs_uri.split('/')[0]}`;
}

/**
 * FileSystemProvider for webhdfs
 */
export class HDFSFileSystemProvider implements vscode.FileSystemProvider {
    private static readonly functionsToBePromisified: (keyof IHDFSClient)[] = ['mkdir', 'readdir', 'stat', 'unlink', 'rename'];

    private onDidChangeFileEmitter: vscode.EventEmitter<vscode.FileChangeEvent[]> = new vscode.EventEmitter<vscode.FileChangeEvent[]>();
    public onDidChangeFile: vscode.Event<vscode.FileChangeEvent[]> = this.onDidChangeFileEmitter.event; // tslint:disable-line

    private clientMap: Map<string, IHDFSClient> = new Map();

    // `${username}@${host}:${port}` (e.g. user@127.0.0.1:50070) as authority
    public async addClient(authority: string): Promise<IHDFSClient | undefined> {
        if (this.clientMap.has(authority)) {
            return;
        }
        const [user, uri] = authority.split('@');
        const [host, port = '80'] = uri.split(':');
        const allConfigurations: IPAICluster[] = (await getSingleton(ClusterManager)).allConfigurations;
        const currentCluster: IPAICluster | undefined = allConfigurations.find(cluster =>
            !!(cluster.username === user && cluster.webhdfs_uri && cluster.webhdfs_uri.startsWith(uri + '/'))
        );
        if (!currentCluster || !currentCluster.webhdfs_uri) {
            throw new Error(`Missing PAI cluster configuration for HDFS '${authority}'`);
        }
        const apiPath: string = currentCluster.webhdfs_uri.substr(currentCluster.webhdfs_uri.indexOf('/'));
        const client: IHDFSClient = createWebHDFSClient(
            { host, port, user, path: apiPath },
            { timeout: 60 * 1000 }
        );
        for (const key of HDFSFileSystemProvider.functionsToBePromisified) {
            client[key] = <any>promisify(client[key]);
        }
        this.clientMap.set(authority, client);
        return client;
    }

    public async getClient(uri: vscode.Uri): Promise<IHDFSClient> {
        let result: IHDFSClient | undefined = this.clientMap.get(uri.authority);
        if (!result) {
            result = await this.addClient(uri.authority);
            if (!result) {
                throw vscode.FileSystemError.Unavailable(uri);
            }
        }
        return result;
    }

    // Implicitly recursive create
    public async createDirectory(uri: vscode.Uri): Promise<void> {
        if (uri.scheme === 'file') {
            // Extra logic. Not required for vscode
            await mkdir(uri.fsPath);
            return;
        }

        let statResult: vscode.FileStat;
        try {
            statResult = await this.stat(uri);
            if (statResult.type !== vscode.FileType.Directory) {
                throw vscode.FileSystemError.FileExists(uri);
            } else {
                // pass
            }
        } catch (e) {
            if (uri.path === '/') {
                throw e;
            }
            await this.createDirectory(Util.uriPathPop(uri));
            try {
                await (await this.getClient(uri)).mkdir(path.join('/', uri.path));
                this.onDidChangeFileEmitter.fire([{ type: vscode.FileChangeType.Created, uri }]);
            } catch (ex) {
                throw new vscode.FileSystemError(ex);
            }
        }
    }

    public async delete(uri: vscode.Uri, options: {recursive: boolean}): Promise<void> {
        try {
            await (await this.getClient(uri)).unlink(path.join('/', uri.path), options.recursive);
            this.onDidChangeFileEmitter.fire([{ type: vscode.FileChangeType.Deleted, uri }]);
        } catch (ex) {
            throw new vscode.FileSystemError(ex);
        }
    }

    public async readDirectory(uri: vscode.Uri): Promise<[string, vscode.FileType][]> {
        if (uri.scheme === 'file') {
            // Extra logic. Not required for vscode
            const rawResult: string[] = await readdir(uri.fsPath);
            const result: [string, vscode.FileType][] = [];
            for (const file of rawResult) {
                const isDirectory: boolean = (await stat(path.join(uri.fsPath, file))).isDirectory();
                result.push([file, isDirectory ? vscode.FileType.Directory : vscode.FileType.File]);
            }
            return result;
        }

        try {
            const rawResult: IHDFSStatResult[] = await (await this.getClient(uri)).readdir(path.join('/', uri.path));
            return rawResult.map(item =>
                Util.tuple([item.pathSuffix, item.type === 'DIRECTORY' ? vscode.FileType.Directory : vscode.FileType.File]));
        } catch (ex) {
            throw new vscode.FileSystemError(ex);
        }
    }

    public async readFile(uri: vscode.Uri): Promise<Uint8Array> {
        const client: IHDFSClient = (await this.getClient(uri));
        const filePath: string = path.join('/', uri.path);
        return await vscode.window.withProgress<Buffer>(
        {
            location: vscode.ProgressLocation.Notification,
            title: __('hdfs.downloading', [filePath]),
            cancellable: true
        },
        (progress, cancellationToken) => new Promise(async (resolve, reject) => {
            let fileStat: IHDFSStatResult;
            try {
                fileStat = await client.stat(filePath);
                if (fileStat.type === 'DIRECTORY') {
                    reject(vscode.FileSystemError.FileIsADirectory(uri));
                    return;
                }
            } catch {
                reject(vscode.FileSystemError.FileNotFound(uri));
                return;
            }
            const stream: fs.ReadStream = client.createReadStream(filePath);
            const data: Buffer[] = [];
            let readAmount: number = 0;
            let error: any;

            cancellationToken.onCancellationRequested(() => {
                error = true;
                stream.close();
                reject(__('hdfs.read.cancelled'));
            });

            stream.once('error', err => {
                error = err;
                stream.close();
                reject(new vscode.FileSystemError(err));
            });

            stream.on('data', (chunk: Buffer) => {
                data.push(chunk);
                readAmount += chunk.byteLength;
                progress.report({
                    message: __('hdfs.progress', [
                        (readAmount / fileStat.length * 100).toFixed(), readAmount, fileStat.length
                    ]),
                    increment: chunk.byteLength / fileStat.length * 100
                });
            });

            stream.once('finish', () => {
                if (!error) {
                    resolve(Buffer.concat(data));
                }
            });
        }));
    }

    public async rename(oldUri: vscode.Uri, newUri: vscode.Uri, options: {overwrite: boolean}): Promise<void> {
        // Check if this operation won't move file out of current folder
        if (oldUri.scheme === newUri.scheme &&
            oldUri.authority === newUri.authority &&
            path.dirname(oldUri.path) === path.dirname(newUri.path)) {
            if (!options.overwrite) {
                try {
                    await this.stat(newUri);
                    throw vscode.FileSystemError.FileExists(newUri);
                } catch { }
            }

            const oldPath: string = unixify(path.join('/', oldUri.path));
            const newPath: string = unixify(path.join('/', newUri.path));
            try {
                await (await this.getClient(oldUri)).rename(oldPath, newPath);
            } catch (ex) {
                throw new vscode.FileSystemError(ex);
            }
        } else {
            await this.copy(oldUri, newUri, options);
            await this.delete(oldUri, { recursive: true });
        }
    }

    public async stat(uri: vscode.Uri): Promise<vscode.FileStat> {
        try {
            if (uri.scheme === 'file') {
                // Extra logic. Not required for vscode
                const rawStat: fs.Stats = await stat(uri.fsPath);
                return {
                    size: rawStat.size,
                    ctime: rawStat.ctime.getTime(),
                    mtime: rawStat.mtime.getTime(),
                    type: rawStat.isDirectory() ? vscode.FileType.Directory : vscode.FileType.File
                };
            }
            const result: IHDFSStatResult = await (await this.getClient(uri)).stat(path.join('/', uri.path));
            return {
                size: result.length,
                ctime: result.modificationTime,
                mtime: result.modificationTime,
                type: result.type === 'DIRECTORY' ? vscode.FileType.Directory : vscode.FileType.File
            };
        } catch (ex) {
            throw new vscode.FileSystemError(ex);
        }
    }

    public watch(uri: vscode.Uri, options: {excludes: string[], recursive: boolean}): vscode.Disposable {
        return new vscode.Disposable(() => undefined);
    }

    public async writeFile(uri: vscode.Uri, content: Uint8Array, options: {create: boolean, overwrite: boolean}): Promise<void> {
        const client: IHDFSClient = (await this.getClient(uri));
        const filePath: string = path.join('/', uri.path);
        await vscode.window.withProgress<Buffer>(
            {
                location: vscode.ProgressLocation.Notification,
                title: __('hdfs.uploading', [filePath]),
                cancellable: true
            },
            (progress, cancellationToken) => new Promise(async (resolve, reject) => {
                try {
                    if ((await client.stat(filePath)).type === 'DIRECTORY') {
                        reject(vscode.FileSystemError.FileIsADirectory(uri));
                        return;
                    }
                    if (!options.overwrite) {
                        reject(vscode.FileSystemError.FileExists(uri));
                        return;
                    }
                } catch {
                    if (!options.create) {
                        reject(vscode.FileSystemError.FileNotFound(uri));
                        return;
                    }
                }
                const local: fs.ReadStream = streamifier.createReadStream(content);
                let writeAmount: number = 0;
                const transform: Transform = new Transform({
                    transform: (chunk: string | Buffer, encoding: string, callback: Function) => {
                        writeAmount += chunk.length;
                        progress.report({
                            message: __('hdfs.progress', [
                                (writeAmount / content.length * 100).toFixed(0), writeAmount, content.length
                            ]),
                            increment: chunk.length / content.length * 100
                        });
                        callback(null, chunk);
                    }
                });
                const stream: Request = await client.createRobustWriteStream(filePath);
                let error: any;

                function cleanup(): void {
                    local.unpipe();
                    transform.unpipe();
                    local.destroy();
                    transform.destroy();
                    stream.destroy();
                }

                cancellationToken.onCancellationRequested(() => {
                    error = true;
                    cleanup();
                    reject(__('hdfs.write.cancelled'));
                });

                local.once('error', err => {
                    error = err;
                    cleanup();
                    reject(new vscode.FileSystemError(err));
                });
                stream.once('error', err => {
                    error = err;
                    cleanup();
                    reject(new vscode.FileSystemError(err));
                });

                stream.once('finish', () => {
                    cleanup();
                    if (!error) {
                        resolve();
                    }
                });

                // TODO: local.pipe(transform).pipe(stream); is not working due to unknown reason...maybe a bug in node-webhdfs?
                local.pipe(transform).pipe(stream);
            })
        );
        this.onDidChangeFileEmitter.fire([{ type: vscode.FileChangeType.Created, uri }]);
    }

    public async copy(source: vscode.Uri, destination: vscode.Uri, options: { overwrite: boolean }): Promise<void> {
        const sourceStat: vscode.FileStat = await this.stat(source);
        let destinationStat: vscode.FileStat | undefined;
        try {
            destinationStat = await this.stat(destination);
        } catch { }
        const sourceIsDir: boolean = sourceStat.type === vscode.FileType.Directory;
        const destinationIsDir: boolean | undefined = destinationStat && destinationStat.type === vscode.FileType.Directory;
        if (sourceIsDir) {
            if (destinationIsDir === undefined) {
                await this.copyFolderToFutureFolder(source, destination, options);
                return;
            } else if (destinationIsDir) {
                await this.copyFolderToFolder(source, destination, options);
                return;
            }
            throw vscode.FileSystemError.FileNotADirectory(destination);
        } else {
            if (destinationIsDir) {
                await this.copyFileToFolder(source, sourceStat.size, destination, options);
                return;
            } else {
                await this.copyFileToFile(source, sourceStat.size, destination, options);
                return;
            }
        }
    }

    private async copyFileToFile(
        source: vscode.Uri, sourceSize: number, destination: vscode.Uri, options: { overwrite: boolean }): Promise<void> {

        let from: fs.ReadStream;
        let to: fs.WriteStream;
        if (source.scheme === 'file') {
            from = fs.createReadStream(source.fsPath);
        } else {
            const sourceClient: IHDFSClient = await this.getClient(source);
            const sourcePath: string = path.join('/', source.path);
            from = sourceClient.createReadStream(sourcePath);
        }

        if (destination.scheme === 'file') {
            to = fs.createWriteStream(destination.fsPath);
        } else {
            const destinationClient: IHDFSClient = await this.getClient(destination);
            const destinationPath: string = path.join('/', destination.path);
            to = destinationClient.createWriteStream(destinationPath);
        }

        await vscode.window.withProgress<Buffer>(
        {
            location: vscode.ProgressLocation.Notification,
            title: __('hdfs.copying', [source.path, destination.path]),
            cancellable: true
        },
        (progress, cancellationToken) => new Promise(async (resolve, reject) => {
            let writeAmount: number = 0;
            const transform: Transform = new Transform({
                transform: (chunk: string | Buffer, encoding: string, callback: Function) => {
                    writeAmount += chunk.length;
                    progress.report({
                        message: __('hdfs.progress', [
                            (writeAmount / sourceSize * 100).toFixed(), writeAmount, sourceSize
                        ]),
                        increment: chunk.length / sourceSize * 100
                    });
                    callback(null, chunk);
                }
            });
            let error: any;

            function cleanup(): void {
                if ('unpipe' in from) {
                    from.unpipe();
                }
                transform.unpipe();
                from.destroy();
                transform.destroy();
                to.destroy();
            }

            cancellationToken.onCancellationRequested(() => {
                error = true;
                cleanup();
                reject(__('hdfs.write.cancelled'));
            });

            from.once('error', err => {
                error = err;
                cleanup();
                reject(new vscode.FileSystemError(err));
            });
            to.once('error', err => {
                error = err;
                cleanup();
                reject(new vscode.FileSystemError(err));
            });

            to.once('finish', () => {
                cleanup();
                if (!error) {
                    resolve();
                }
            });

            from.pipe(transform).pipe(to);
        }));
        this.onDidChangeFileEmitter.fire([{ type: vscode.FileChangeType.Created, uri: destination }]);
    }

    private copyFileToFolder(
        source: vscode.Uri, sourceSize: number, destination: vscode.Uri, options: { overwrite: boolean }): Promise<void> {

        const fileName: string = path.basename(source.path);
        destination = Util.uriPathAppend(destination, fileName);
        return this.copyFileToFile(source, sourceSize, destination, options);
    }

    private copyFolderToFolder(source: vscode.Uri, destination: vscode.Uri, options: { overwrite: boolean }): Promise<void> {
        return this.copyFolderToFutureFolder(source, Util.uriPathAppend(destination, path.basename(source.path)), options);
    }

    private async copyFolderToFutureFolder(source: vscode.Uri, destination: vscode.Uri, options: { overwrite: boolean }): Promise<void> {
        const files: [string, vscode.FileType][] = await this.readDirectory(source);
        await this.createDirectory(destination);
        this.onDidChangeFileEmitter.fire([{ type: vscode.FileChangeType.Created, uri: destination }]);
        for (const file of files) {
            await this.copy(Util.uriPathAppend(source, file[0]), destination, options);
        }
    }
}

/**
 * HDFS management module
 */
@injectable()
export class HDFS extends Singleton {
    public readonly provider: HDFSFileSystemProvider;
    private UPLOADFILES: string = __('hdfs.dialog.label.upload-files');
    private UPLOADFOLDER: string = __('hdfs.dialog.label.upload-folders');
    private DOWNLOADHERE: string = __('hdfs.dialog.label.download');

    constructor() {
        super();
        console.log('Registering HDFS...');
        this.provider = new HDFSFileSystemProvider();
        this.context.subscriptions.push(
            vscode.workspace.registerFileSystemProvider('webhdfs', this.provider, { isCaseSensitive: true })
        );
        console.log('HDFS registered as webhdfs:/...');
        this.context.subscriptions.push(
            vscode.commands.registerCommand(
                COMMAND_OPEN_HDFS,
                async (node?: ClusterExplorerChildNode | IPAICluster) => {
                    if (!node) {
                        const manager: ClusterManager = await getSingleton(ClusterManager);
                        const index: number | undefined = await manager.pick();
                        if (index === undefined) {
                            return;
                        }
                        await this.open(manager.allConfigurations[index]);
                    } else if (node instanceof ClusterExplorerChildNode) {
                        await this.open((await getSingleton(ClusterManager)).allConfigurations[node.index]);
                    } else {
                        await this.open(node);
                    }
                }
            ),
            vscode.commands.registerCommand(COMMAND_HDFS_UPLOAD_FILES, async (param: vscode.Uri | vscode.TreeItem) => {
                await this.uploadFiles(this.unpackParam(param));
            }),
            vscode.commands.registerCommand(COMMAND_HDFS_UPLOAD_FOLDERS, async (param: vscode.Uri | vscode.TreeItem) => {
                await this.uploadFolders(this.unpackParam(param));
            }),
            vscode.commands.registerCommand(COMMAND_HDFS_DOWNLOAD, async (param: vscode.Uri | vscode.TreeItem) => {
                await this.download(this.unpackParam(param));
            })
        );
    }

    public async open(conf: IPAICluster): Promise<void> {
        if (!conf.webhdfs_uri) {
            Util.err('hdfs.initialization.missingconfiguration');
            return;
        }
        const setting: string | undefined = vscode.workspace.getConfiguration(SETTING_SECTION_HDFS).get(SETTING_HDFS_EXPLORER_LOCATION);
        if (setting === ENUM_HDFS_EXPLORER_LOCATION.explorer) {
            let start: number = 0;
            let deleteCount: number = 0;
            if (vscode.workspace.workspaceFolders) {
                start = vscode.workspace.workspaceFolders.findIndex(folder => folder.uri.scheme === 'webhdfs');
                if (start >= 0) {
                    deleteCount = 1;
                } else {
                    start = vscode.workspace.workspaceFolders.length;
                }
            }
            try {
                // this.provider!.addClient(getHDFSUriAuthority(configuration));
                await vscode.commands.executeCommand('workbench.view.explorer');
                void vscode.window.showInformationMessage(__('hdfs.open.prompt', [conf.webhdfs_uri]));
                vscode.workspace.updateWorkspaceFolders(start, deleteCount, {
                    uri: vscode.Uri.parse(`webhdfs://${getHDFSUriAuthority(conf)}/`),
                    name: __('hdfs.workspace.title', [conf.webhdfs_uri])
                });
                // Extension may be reloaded at this point due to workspace changes
            } catch (ex) {
                Util.err('hdfs.open.error', [ex]);
            }
        } else {
            const provider: HDFSTreeDataProvider = await getSingleton(HDFSTreeDataProvider);
            provider.setUri(vscode.Uri.parse(`webhdfs://${getHDFSUriAuthority(conf)}/`));
        }
    }

    public async close(index: number): Promise<void> {
        const configuration: IPAICluster = (await getSingleton(ClusterManager)).allConfigurations[index];
        const authority: string = getHDFSUriAuthority(configuration);
        if (vscode.workspace.workspaceFolders) {
            const pos: number = vscode.workspace.workspaceFolders.findIndex(
                folder => folder.uri.scheme === 'webhdfs' && folder.uri.authority === authority);
            if (pos >= 0) {
                vscode.workspace.updateWorkspaceFolders(pos, 1);
            }
        }
    }

    private unpackParam(param: vscode.Uri | vscode.TreeItem): vscode.Uri {
        if (param instanceof vscode.TreeItem) {
            if (param.resourceUri !== undefined) {
                return param.resourceUri;
            } else {
                throw new Error('Invalid HDFS operation param');
            }
        } else {
            return param;
        }
    }

    private async download(from: vscode.Uri): Promise<void> {
        const files: vscode.Uri[] | undefined = await vscode.window.showOpenDialog({
            canSelectFiles: false,
            canSelectFolders: true,
            canSelectMany: false,
            openLabel: this.DOWNLOADHERE
        });
        if (!files) {
            return;
        }
        await this.provider!.copy(from, files[0], { overwrite: true });
    }

    private async uploadFiles(target: vscode.Uri): Promise<void> {
        const files: vscode.Uri[] | undefined = await vscode.window.showOpenDialog({
            canSelectFiles: true,
            canSelectMany: true,
            openLabel: this.UPLOADFILES
        });
        if (!files) {
            return;
        }
        return this.upload(files, target);
    }

    private async uploadFolders(target: vscode.Uri): Promise<void> {
        const folders: vscode.Uri[] | undefined = await vscode.window.showOpenDialog({
            canSelectFiles: false,
            canSelectFolders: true,
            canSelectMany: true,
            openLabel: this.UPLOADFOLDER
        });
        if (!folders) {
            return;
        }
        return this.upload(folders, target);
    }

    private async upload(localUris: vscode.Uri[], remote: vscode.Uri): Promise<void> {
        const statusBarItem: vscode.StatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, Number.MAX_VALUE);
        statusBarItem.text = `${OCTICON_CLOUDUPLOAD} ${__('hdfs.upload.status', [0, localUris.length])}`;
        statusBarItem.show();
        try {
            for (const [i, file] of localUris.entries()) {
                const suffix: string = path.basename(file.fsPath);
                statusBarItem.text = `${OCTICON_CLOUDUPLOAD} ${__('hdfs.upload.status', [i, localUris.length])}`;
                await this.provider!.copy(file, Util.uriPathAppend(remote, suffix), { overwrite: true });
            }
            Util.info('hdfs.upload.success');
        } catch (ex) {
            Util.err('hdfs.upload.error', [ex]);
        }
        statusBarItem.dispose();
    }
}