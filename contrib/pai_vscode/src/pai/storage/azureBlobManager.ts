/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */

import { BlockBlobClient, ContainerClient } from '@azure/storage-blob';
import { injectable } from 'inversify';
import * as path from 'path';
import { commands, window, StatusBarAlignment, StatusBarItem, Uri } from 'vscode';

import {
    COMMAND_AZURE_BLOB_DELETE,
    COMMAND_AZURE_BLOB_DOWNLOAD,
    COMMAND_AZURE_BLOB_UPLOAD_FILES,
    COMMAND_AZURE_BLOB_UPLOAD_FOLDERS,
    OCTICON_CLOUDUPLOAD,
    COMMAND_AZURE_BLOB_CREATE_FOLDER
} from '../../common/constants';
import { __ } from '../../common/i18n';
import { Singleton } from '../../common/singleton';
import { Util } from '../../common/util';
import { AzureBlobRootItem, AzureBlobTreeItem, BlobEntity, BlobIter, BlobValue } from '../container/storage/azureBlobTreeItem';
import { util } from 'node-yaml-parser';

/**
 * Azure blob management module
 */
@injectable()
export class AzureBlobManager extends Singleton {
    constructor() {
        super();
        this.context.subscriptions.push(
            commands.registerCommand(
                COMMAND_AZURE_BLOB_DOWNLOAD,
                async (item: AzureBlobTreeItem) => {
                    console.log('not implemented');
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
                    return this.upload(files, target);
                }
            ),
            commands.registerCommand(
                COMMAND_AZURE_BLOB_UPLOAD_FOLDERS,
                async (prefix: AzureBlobTreeItem | AzureBlobRootItem) => {
                    console.log('not implemented');
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
            })
        );
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

    public async upload(files: Uri[], target: AzureBlobTreeItem | AzureBlobRootItem): Promise<void> {
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