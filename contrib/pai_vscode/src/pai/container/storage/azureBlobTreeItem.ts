/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */

import { PagedAsyncIterableIterator } from '@azure/core-paging';
import {
    BlobGetPropertiesResponse,
    BlobItem,
    BlobPrefix,
    BlobServiceClient,
    ContainerClient,
    ContainerListBlobHierarchySegmentResponse,
    StorageSharedKeyCredential
} from '@azure/storage-blob';
import { IStorage } from 'openpai-js-sdk';
import { Event, EventEmitter, TreeItemCollapsibleState, Uri } from 'vscode';

import {
    CONTEXT_STORAGE_AZURE_BLOB,
    CONTEXT_STORAGE_AZURE_BLOB_FOLDER,
    CONTEXT_STORAGE_AZURE_BLOB_ITEM,
    ICON_FOLDER
} from '../../../common/constants';
import { __ } from '../../../common/i18n';
import { Util } from '../../../common/util';
import { TreeNode } from '../common/treeNode';

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

async function getMetadata(blob: BlobValue, client: ContainerClient): Promise<BlobMetadata> {
    if (blob.kind === 'prefix') {
        return undefined;
    }

    try {
        const res: BlobGetPropertiesResponse = await client.getBlobClient(blob.name).getProperties();
        return res.metadata;
    } catch (err) {
        return undefined;
    }
}

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

function getBlobName(blob: BlobValue, metadata: BlobMetadata): string {
    if (isFolder(blob, metadata) && !blob.name.endsWith('/')) {
        return `${blob.name}/`;
    }
    return blob.name;
}

function distinctChildren(children: Map<string, AzureBlobTreeItem>): TreeNode[] {
    const blobs: TreeNode[] = [];
    for (const [name, item] of children) {
        if (item.metadata && item.metadata.hdi_isfolder && item.metadata.hdi_isfolder === 'true') {
            if (children.has(`${name}/`)) {
                continue;
            }
        }
        blobs.push(item);
    }
    return blobs;
}

/**
 * PAI azure blob storage tree item.
 */
export class AzureBlobTreeItem extends TreeNode {
    public blobs?: TreeNode[];
    public client: ContainerClient;

    public blob: BlobValue;
    public metadata: BlobMetadata;
    public onDidChangeTreeData: Event<TreeNode>;

    private onDidChangeTreeDataEmitter: EventEmitter<TreeNode>;

    public constructor(blob: BlobValue, metadata: BlobMetadata, client: ContainerClient, parent: TreeNode) {
        const folder: boolean = isFolder(blob, metadata);
        super(getBlobName(blob, metadata), folder ?
            TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.None);
        this.metadata = metadata;
        this.contextValue = folder ?
            CONTEXT_STORAGE_AZURE_BLOB_FOLDER : CONTEXT_STORAGE_AZURE_BLOB_ITEM;
        if (folder) {
            this.iconPath = Uri.file(Util.resolvePath(ICON_FOLDER));
        }
        this.parent = parent;
        this.client = client;
        this.blob = blob;
        this.onDidChangeTreeDataEmitter = new EventEmitter<TreeNode>();
        this.onDidChangeTreeData = this.onDidChangeTreeDataEmitter.event;
    }

    public async getChildren(): Promise<TreeNode[] | undefined> {
        if (!isFolder(this.blob, this.metadata)) {
            return undefined;
        } else if (this.blobs) {
            return this.blobs;
        }

        await this.reloadChildren();
        return this.blobs;
    }

    public async reloadChildren(): Promise<void> {
        const children: Map<string, AzureBlobTreeItem> = new Map<string, AzureBlobTreeItem>();
        try {
            const iter: BlobIter = this.client.listBlobsByHierarchy('/', {
                prefix: <string> this.label
            });
            let blobItem: BlobEntity = await iter.next();
            while (!blobItem.done) {
                const blob: BlobValue = blobItem.value;
                const metadata: BlobMetadata = await getMetadata(blob, this.client);
                children.set(blob.name, new AzureBlobTreeItem(blob, metadata, this.client, this));
                blobItem = await iter.next();
            }
        } catch (err) {
            this.blobs = [
                <TreeNode> {
                    parent: this,
                    label: __('treeview.node.storage.load-error'),
                    description: err.message || err
                }
            ];
        }

        this.blobs = distinctChildren(children);
    }

    public async refresh(): Promise<void> {
        await this.reloadChildren();
        this.onDidChangeTreeDataEmitter.fire();
    }
}

/**
 * PAI azure blob storage root item.
 */
export class AzureBlobRootItem extends TreeNode {
    public storage: IStorage;
    public client: ContainerClient;
    public blobs?: TreeNode[];

    public constructor(storage: IStorage, parent: TreeNode) {
        super(storage.spn, TreeItemCollapsibleState.Collapsed);
        this.storage = storage;
        this.contextValue = CONTEXT_STORAGE_AZURE_BLOB;
        this.description = 'Azure Blob';
        this.parent = parent;

        const credential: StorageSharedKeyCredential =
            new StorageSharedKeyCredential(storage.data.accountName, storage.data.key);
        const blobClient: BlobServiceClient = new BlobServiceClient(
            `https://${storage.data.accountName}.blob.core.windows.net`, credential);
        this.client = blobClient.getContainerClient(storage.data.containerName);
    }

    public async getChildren(): Promise<TreeNode[]> {
        if (this.blobs) {
            return this.blobs;
        }

        const children: Map<string, AzureBlobTreeItem> = new Map<string, AzureBlobTreeItem>();
        try {
            this.blobs = [
                <TreeNode> {
                    parent: this,
                    label: __('treeview.node.storage.mount-point'),
                    description: '/data'
                }
            ];
            const prefix: string = '/';
            const iter: BlobIter = this.client.listBlobsByHierarchy(prefix);
            let blobItem: BlobEntity = await iter.next();
            while (!blobItem.done) {
                const blob: BlobValue = blobItem.value;
                const metadata: BlobMetadata = await getMetadata(blob, this.client);
                children.set(blob.name, new AzureBlobTreeItem(blob, metadata, this.client, this));
                blobItem = await iter.next();
            }
        } catch (err) {
            return [
                <TreeNode> {
                    parent: this,
                    label: __('treeview.node.storage.load-error'),
                    description: err.message || err
                }
            ];
        }

        distinctChildren(children).forEach(item => this.blobs!.push(item));
        return this.blobs;
    }
}
