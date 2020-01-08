/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */

import {
    BlobGetPropertiesResponse,
    BlockBlobClient,
    ContainerClient
} from '@azure/storage-blob';
import * as path from 'path';
import {
    window,
    StatusBarAlignment,
    StatusBarItem,
    Uri
} from 'vscode';

import {
    OCTICON_CLOUDDOWNLOAD,
    OCTICON_CLOUDUPLOAD
} from '../../common/constants';
import { __ } from '../../common/i18n';
import { Util } from '../../common/util';
import { StorageTreeNode } from '../container/common/treeNode';
import {
    AzureBlobRootItem, AzureBlobTreeItem, BlobEntity, BlobIter, BlobValue
} from '../container/storage/azureBlobTreeItem';

/**
 * Azure blob management module
 */
// tslint:disable-next-line: no-unnecessary-class
export class AzureBlobManager {
    public static async delete(target: AzureBlobTreeItem): Promise<void> {
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

    public static async deleteBlobsByHierarchy(client: ContainerClient, prefix: string): Promise<void> {
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

    public static async downloadFile(target: AzureBlobTreeItem, filePath?: Uri): Promise<void> {
        if (!filePath) {
            filePath = await window.showSaveDialog({
                saveLabel: __('storage.dialog.label.download'),
                defaultUri: Uri.file(target.blob.name)
            });
            if (!filePath || filePath.scheme !== 'file') {
                return;
            }
        }

        const client: BlockBlobClient = target.client.getBlockBlobClient(target.blob.name);
        const properties: BlobGetPropertiesResponse = await client.getProperties();
        let totalBytes: number = 1;
        if (properties && properties.contentLength) {
            totalBytes = properties.contentLength;
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

    public static async createFolder(target: AzureBlobTreeItem | AzureBlobRootItem): Promise<void> {
        const name: string | undefined = await window.showInputBox({
            prompt: __('container.azure.blob.mkdir.prompt')
        });
        if (name === undefined) {
            Util.warn('container.azure.blob.mkdir.cancelled');
            return;
        }

        const blobName: string = path.join(target.rootPath, name);
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

    public static async uploadFiles(target: AzureBlobTreeItem | AzureBlobRootItem, files?: Uri[]): Promise<void> {
        if (!files) {
            files = await window.showOpenDialog({
                canSelectFiles: true,
                canSelectMany: true,
                openLabel: __('storage.dialog.label.upload-files')
            });
            if (!files) {
                return;
            }
        }

        const statusBarItem: StatusBarItem =
            window.createStatusBarItem(StatusBarAlignment.Right, Number.MAX_VALUE);
        statusBarItem.text =
            `${OCTICON_CLOUDUPLOAD} ${__('storage.upload.status', [0, files.length])}`;
        statusBarItem.show();
        try {
            for (const [i, file] of files.entries()) {
                const name: string = path.basename(file.fsPath);
                const blobName: string = path.join(target.rootPath, name);
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
    }

    public static async uploadFolders(
        target: StorageTreeNode,
        folders?: Uri[]
    ): Promise<void> {
        if (!folders) {
            folders = await window.showOpenDialog({
                canSelectFolders: true,
                canSelectMany: true,
                openLabel: __('storage.dialog.label.upload-folders')
            });
            if (!folders) {
                return;
            }
        }
        console.log('not implemented.');
    }
}
