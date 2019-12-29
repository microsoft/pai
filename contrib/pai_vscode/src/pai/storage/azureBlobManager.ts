/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */

import { BlockBlobClient, ContainerClient } from '@azure/storage-blob';
import { injectable } from 'inversify';
import * as path from 'path';
import { commands, window, StatusBarAlignment, StatusBarItem, Uri, TextDocument, workspace } from 'vscode';

import {
    COMMAND_AZURE_BLOB_CREATE_FOLDER,
    COMMAND_AZURE_BLOB_DELETE,
    COMMAND_AZURE_BLOB_DOWNLOAD,
    COMMAND_AZURE_BLOB_UPLOAD_FILES,
    COMMAND_AZURE_BLOB_UPLOAD_FOLDERS,
    COMMAND_OPEN_AZURE_BLOB,
    OCTICON_CLOUDDOWNLOAD,
    OCTICON_CLOUDUPLOAD
} from '../../common/constants';
import { __ } from '../../common/i18n';
import { Singleton } from '../../common/singleton';
import { Util } from '../../common/util';
import { AzureBlobRootItem, AzureBlobTreeItem, BlobEntity, BlobIter, BlobValue } from '../container/storage/azureBlobTreeItem';

/**
 * Azure blob management module
 */
@injectable()
export class AzureBlobManager extends Singleton {
    private fileMap: { [key: string]: [TextDocument, AzureBlobTreeItem] } = {};

    constructor() {
        super();
        this.context.subscriptions.push(
            commands.registerCommand(
                COMMAND_AZURE_BLOB_DOWNLOAD,
                async (target: AzureBlobTreeItem) => {
                    const uri: Uri | undefined = await window.showSaveDialog({
                        saveLabel: __('storage.dialog.label.download'),
                        defaultUri: Uri.file(target.blob.name)
                    });
                    if (uri && uri.scheme === 'file') {
                        await this.downloadFile(target, uri);
                    }
                }
            ),
            commands.registerCommand(
                COMMAND_AZURE_BLOB_UPLOAD_FILES,
                async (target: AzureBlobTreeItem | AzureBlobRootItem) => {
                    const files: Uri[] | undefined = await window.showOpenDialog({
                        canSelectFiles: true,
                        canSelectMany: true,
                        openLabel: __('storage.dialog.label.upload-files')
                    });
                    if (!files) {
                        return;
                    }
                    return this.uploadFiles(files, target);
                }
            ),
            commands.registerCommand(
                COMMAND_AZURE_BLOB_UPLOAD_FOLDERS,
                async (target: AzureBlobTreeItem | AzureBlobRootItem) => {
                    const folders: Uri[] | undefined = await window.showOpenDialog({
                        canSelectFolders: true,
                        canSelectMany: true,
                        openLabel: __('storage.dialog.label.upload-folders')
                    });
                    if (!folders) {
                        return;
                    }
                    return this.uploadFolders(folders, target);
                }
            ),
            commands.registerCommand(
                COMMAND_AZURE_BLOB_DELETE,
                async (target: AzureBlobTreeItem) => {
                    return this.delete(target);
                }
            ),
            commands.registerCommand(
                COMMAND_AZURE_BLOB_CREATE_FOLDER,
                async (target: AzureBlobTreeItem | AzureBlobRootItem) => {
                    const res: string | undefined = await window.showInputBox({
                        prompt: __('container.azure.blob.mkdir.prompt')
                    });
                    if (res === undefined) {
                        Util.warn('container.azure.blob.mkdir.cancelled');
                    } else {
                        await this.createFolder(res, target);
                    }
            }),
            commands.registerCommand(
                COMMAND_OPEN_AZURE_BLOB,
                async (item: AzureBlobTreeItem) => await this.showEditor(item)
                // todo: need to register onDidSaveTextDocument to auto upload.
            )
        );
    }

    public async showEditor(item: AzureBlobTreeItem): Promise<void> {
        const fileName: string = item.blob.name;

        try {
            const parsedPath: path.ParsedPath = path.posix.parse(fileName);
            const temporaryFilePath: string = await Util.createTemporaryFile(parsedPath.base);
            await this.downloadFile(item, Uri.file(temporaryFilePath));
            const document: TextDocument | undefined = <TextDocument | undefined>
                await workspace.openTextDocument(temporaryFilePath);
            if (document) {
                this.fileMap[temporaryFilePath] = [document, item];
                await window.showTextDocument(document);
            } else {
                Util.err('storage.download.error', 'Unable to open');
            }
        } catch (err) {
            Util.err('storage.download.error', [err]);
        }
    }

    public async downloadFile(target: AzureBlobTreeItem, filePath: Uri): Promise<void> {
        const client: BlockBlobClient = target.client.getBlockBlobClient(target.blob.name);
        let totalBytes: number = 1;
        if (target.properties && target.properties.contentLength) {
            totalBytes = target.properties.contentLength;
        }

        const statusBarItem: StatusBarItem =
        window.createStatusBarItem(StatusBarAlignment.Right, Number.MAX_VALUE);
        statusBarItem.text =
            `${OCTICON_CLOUDUPLOAD} ${__('storage.download.status', [0, totalBytes])}`;
        statusBarItem.show();
        try {
            await client.downloadToFile(filePath.fsPath, undefined, undefined, {
                onProgress: event => {
                    statusBarItem.text =
                    `${OCTICON_CLOUDDOWNLOAD} ${__('storage.download.status', [event.loadedBytes, totalBytes])}`;
                }
            });
            Util.info('storage.download.success');
        } catch (err) {
            Util.err('storage.download.error', [err]);
        }
        statusBarItem.dispose();
    }

    public async createFolder(name: string, target: AzureBlobTreeItem | AzureBlobRootItem): Promise<void> {
        const blobName: string = target instanceof AzureBlobRootItem ? name : `${target.label}${name}`;
        try {
            await target.client.getBlockBlobClient(blobName).upload('', 0, {
                metadata: {
                    hdi_isfolder: 'true'
                }
            });

            Util.info('storage.create.folder.success');
        } catch (err) {
            Util.err('storage.create.folder.error', [err]);
        }
    }

    public async uploadFiles(files: Uri[], target: AzureBlobTreeItem | AzureBlobRootItem): Promise<void> {
        const statusBarItem: StatusBarItem =
            window.createStatusBarItem(StatusBarAlignment.Right, Number.MAX_VALUE);
        statusBarItem.text =
            `${OCTICON_CLOUDUPLOAD} ${__('storage.upload.status', [0, files.length])}`;
        statusBarItem.show();
        try {
            for (const [i, file] of files.entries()) {
                const name: string = path.basename(file.fsPath);
                const blobName: string =
                    target instanceof AzureBlobRootItem ? name : `${target.label}${name}`;
                statusBarItem.text =
                    `${OCTICON_CLOUDUPLOAD} ${__('storage.upload.status', [i, files.length])}`;
                const client: BlockBlobClient = target.client.getBlockBlobClient(blobName);
                await client.uploadFile(file.fsPath);
            }
            Util.info('storage.upload.success');
        } catch (err) {
            Util.err('storage.upload.error', [err]);
        }
        statusBarItem.dispose();

        await (<AzureBlobTreeItem> target).refresh();
    }

    public async uploadFolders(folders: Uri[], target: AzureBlobTreeItem | AzureBlobRootItem): Promise<void> {
        console.log('not implemented.');
    }

    public async delete(target: AzureBlobTreeItem): Promise<void> {
        try {
            if (target.blob.kind === 'blob') {
                await target.client.deleteBlob(target.blob.name);
            } else {
                await this.deleteBlobsByHierarchy(target.client, target.blob.name);
            }
            Util.info('storage.delete.success');
        } catch (err) {
            Util.err('storage.delete.error', [err]);
        }

        await (<AzureBlobTreeItem> target.parent).refresh();
    }

    public async deleteBlobsByHierarchy(client: ContainerClient, prefix: string): Promise<void> {
        const iter: BlobIter = client.listBlobsByHierarchy('/', {
            prefix: <string> prefix
        });
        let blobItem: BlobEntity = await iter.next();
        while (!blobItem.done) {
            const blob: BlobValue = blobItem.value;
            if (blob.kind === 'blob') {
                await client.deleteBlob(blob.name);
            } else {
                try {
                    await client.deleteBlob(blob.name.slice(0, -1));
                } catch { }
                await this.deleteBlobsByHierarchy(client, blob.name);
            }
            blobItem = await iter.next();
        }
    }
}