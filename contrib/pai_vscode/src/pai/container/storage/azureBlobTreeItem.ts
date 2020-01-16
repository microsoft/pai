/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */

import { PagedAsyncIterableIterator } from '@azure/core-paging';
import {
    BlobItem,
    BlobPrefix,
    BlobServiceClient,
    ContainerClient,
    ContainerListBlobHierarchySegmentResponse,
    StorageSharedKeyCredential
} from '@azure/storage-blob';
import { IStorageServer } from 'openpai-js-sdk';
import * as path from 'path';
import { TreeItemCollapsibleState, Uri } from 'vscode';

import {
    COMMAND_STORAGE_OPEN_FILE,
    COMMAND_TREEVIEW_DOUBLECLICK,
    CONTEXT_STORAGE_AZURE_BLOB,
    CONTEXT_STORAGE_FILE,
    CONTEXT_STORAGE_FOLDER,
    CONTEXT_STORAGE_LOAD_MORE,
    ICON_FILE,
    ICON_FOLDER,
    ICON_STORAGE
} from '../../../common/constants';
import { __ } from '../../../common/i18n';
import { getSingleton } from '../../../common/singleton';
import { Util } from '../../../common/util';
import { AzureBlobManager } from '../../storage/azureBlobManager';
import { RemoteFileEditor } from '../../utility/remoteFileEditor';
import { StorageLoadMoreTreeNode, StorageTreeNode } from '../common/treeNode';

export type BlobIter = PagedAsyncIterableIterator<({
        kind: 'prefix';
    } & BlobPrefix) | ({
        kind: 'blob';
    } & BlobItem), ContainerListBlobHierarchySegmentResponse>;

export type BlobValue = ({
        kind: 'prefix';
    } & BlobPrefix) | ({
        kind: 'blob';
    } & BlobItem);

export type BlobEntity = {
        done?: boolean | undefined;
        value: ({
            kind: 'prefix';
        } & BlobPrefix) | ({
            kind: 'blob';
        } & BlobItem);
    };

export type BlobMetadata = {
        [propertyName: string]: string;
    } | undefined;

function isFolder(blob: BlobValue, metadata: BlobMetadata): boolean {
    if (blob.kind === 'prefix') {
        return true;
    } else if (metadata &&
            metadata.hdi_isfolder &&
            metadata.hdi_isfolder === 'true') {
        return true;
    }
    return false;
}

/**
 * PAI azure blob storage tree item.
 */
export class AzureBlobTreeItem extends StorageTreeNode {
    public client: ContainerClient;
    public blob: BlobValue;
    public rootPath: string;

    private currentContinuationToken?: string;
    private currentPrefixes: Map<string, AzureBlobTreeItem>;

    public constructor(
        blob: BlobValue,
        client: ContainerClient,
        parent: StorageTreeNode
    ) {
        const metadata: BlobMetadata = blob.kind === 'blob' ? blob.metadata : undefined;
        const folder: boolean = isFolder(blob, metadata);
        const name: string | undefined = path.basename(blob.name);

        super(
            name ? name : path.dirname(blob.name),
            parent,
            folder ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.None
        );

        this.contextValue = folder ?
            CONTEXT_STORAGE_FOLDER : CONTEXT_STORAGE_FILE;
        this.client = client;
        this.blob = blob;
        this.rootPath = blob.name;
        this.description = this.rootPath;
        this.currentPrefixes = new Map<string, AzureBlobTreeItem>();

        if (folder) {
            this.iconPath = Uri.file(Util.resolvePath(ICON_FOLDER));
        } else {
            this.iconPath = Uri.file(Util.resolvePath(ICON_FILE));
            this.command = {
                title: __('treeview.node.storage.openfile'),
                command: COMMAND_TREEVIEW_DOUBLECLICK,
                arguments: [COMMAND_STORAGE_OPEN_FILE, this]
            };
        }
    }

    public async refresh(): Promise<void> {
        if (this.blob.kind === 'blob') {
            return;
        }

        this.currentContinuationToken = undefined;
        this.currentPrefixes.clear();
        this.children = [];

        await this.loadMore();
    }

    public async loadMore(): Promise<void> {
        if (this.children.length > 0 &&
            this.children[this.children.length - 1].contextValue === CONTEXT_STORAGE_LOAD_MORE
        ) {
            this.children.pop();
        }

        try {
            const iter: IteratorResult<ContainerListBlobHierarchySegmentResponse> =
                await this.client.listBlobsByHierarchy('/', {
                    prefix: <string> this.rootPath,
                    includeMetadata: true
                }).byPage({
                    continuationToken: this.currentContinuationToken,
                    maxPageSize: AzureBlobTreeItem.pageSize
                }).next();
            this.currentContinuationToken = iter.value.continuationToken;
            const prefixes: BlobPrefix[] | undefined = iter.value.segment.blobPrefixes;
            if (prefixes) {
                prefixes.forEach(item => {
                    const value: BlobValue = <BlobValue>item;
                    value.kind = 'prefix';
                    const node: AzureBlobTreeItem =
                        new AzureBlobTreeItem(value, this.client, this);
                    this.currentPrefixes.set(item.name, node);
                    this.children.push(node);
                });
            }
            const blobs: BlobItem[] = iter.value.segment.blobItems;

            for (const blob of blobs) {
                if (blob.metadata && blob.metadata.hdi_isfolder && blob.metadata.hdi_isfolder === 'true') {
                    if (this.currentPrefixes.has(`${blob.name}/`)) {
                        continue;
                    }
                }
                const value: BlobValue = <BlobValue>blob;
                value.kind = 'blob';
                this.children.push(new AzureBlobTreeItem(value, this.client, this));
            }

            if (this.currentContinuationToken) {
                this.children.push(new StorageLoadMoreTreeNode(this));
            }
        } catch (err) {
            const child: StorageTreeNode =
                new StorageTreeNode(__('treeview.node.storage.load-error'), this);
            child.description = err.message;
            this.children.push(child);
        }
    }

    public async download(dest?: Uri): Promise<void> {
        await AzureBlobManager.downloadFile(this, dest);
    }

    public async uploadFile(files?: Uri[]): Promise<void> {
        await AzureBlobManager.uploadFiles(this, files);
    }

    public async delete(): Promise<void> {
        await AzureBlobManager.delete(this);
    }

    public async openFile(): Promise<void> {
        const remoteFileEditor: RemoteFileEditor =
            await getSingleton(RemoteFileEditor);
        await remoteFileEditor.showEditor(this);
    }

    public async uploadFolder(): Promise<void> {
        await AzureBlobManager.uploadFolders(this);
    }

    public async createFolder(): Promise<void> {
        await AzureBlobManager.createFolder(this);
    }
}

/**
 * PAI azure blob storage root item.
 */
export class AzureBlobRootItem extends StorageTreeNode {
    public storage: IStorageServer;
    public client: ContainerClient;
    public rootPath: string;

    private currentContinuationToken?: string;
    private currentPrefixes: Map<string, AzureBlobTreeItem>;

    public constructor(storage: IStorageServer, rootPath: string, parent: StorageTreeNode) {
        super(storage.spn, parent, TreeItemCollapsibleState.Collapsed);
        this.storage = storage;
        this.contextValue = CONTEXT_STORAGE_AZURE_BLOB;
        this.description = 'Azure Blob';
        this.rootPath = rootPath;
        this.iconPath = Uri.file(Util.resolvePath(ICON_STORAGE));
        this.currentPrefixes = new Map<string, AzureBlobTreeItem>();

        const credential: StorageSharedKeyCredential =
            new StorageSharedKeyCredential(storage.data.accountName, storage.data.key);
        const blobClient: BlobServiceClient = new BlobServiceClient(
            `https://${storage.data.accountName}.blob.core.windows.net`, credential);
        this.client = blobClient.getContainerClient(storage.data.containerName);
    }

    public async refresh(): Promise<void> {
        this.currentContinuationToken = undefined;
        this.currentPrefixes.clear();
        this.children = [];
        await this.loadMore();
    }

    public async loadMore(): Promise<void> {
        if (this.children.length > 0 &&
            this.children[this.children.length - 1].contextValue === CONTEXT_STORAGE_LOAD_MORE
        ) {
            this.children.pop();
        }

        try {
            const iter: IteratorResult<ContainerListBlobHierarchySegmentResponse> =
                await this.client.listBlobsByHierarchy('/', {
                    prefix: this.rootPath,
                    includeMetadata: true
                }).byPage({
                    continuationToken: this.currentContinuationToken,
                    maxPageSize: AzureBlobTreeItem.pageSize
                }).next();
            this.currentContinuationToken = iter.value.continuationToken;
            const prefixes: BlobPrefix[] | undefined = iter.value.segment.blobPrefixes;
            if (prefixes) {
                prefixes.forEach(item => {
                    const value: BlobValue = <BlobValue>item;
                    value.kind = 'prefix';
                    const node: AzureBlobTreeItem =
                        new AzureBlobTreeItem(value, this.client, this.parent!);
                    this.currentPrefixes.set(item.name, node);
                    this.children.push(node);
                });
            }
            const blobs: BlobItem[] = iter.value.segment.blobItems;

            for (const blob of blobs) {
                if (blob.metadata && blob.metadata.hdi_isfolder && blob.metadata.hdi_isfolder === 'true') {
                    if (this.currentPrefixes.has(`${blob.name}/`)) {
                        continue;
                    }
                }
                const value: BlobValue = <BlobValue>blob;
                value.kind = 'blob';
                this.children.push(new AzureBlobTreeItem(value, this.client, this.parent!));
            }

            if (this.currentContinuationToken) {
                this.children.push(new StorageLoadMoreTreeNode(this.parent!));
            }
        } catch (err) {
            const child: StorageTreeNode =
                new StorageTreeNode(__('treeview.node.storage.load-error'), this.parent);
            child.description = err.message;
            this.children.push(child);
        }
    }

    public async uploadFile(files?: Uri[]): Promise<void> {
        await AzureBlobManager.uploadFiles(this, files);
    }

    public async uploadFolder(): Promise<void> {
        await AzureBlobManager.uploadFolders(this);
    }

    public async createFolder(): Promise<void> {
        await AzureBlobManager.createFolder(this);
    }
}
