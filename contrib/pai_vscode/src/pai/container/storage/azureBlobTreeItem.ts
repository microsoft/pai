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
import { IStorage } from 'openpai-js-sdk';
import { TreeItemCollapsibleState } from 'vscode';

import {
    CONTEXT_STORAGE_AZURE_BLOB, CONTEXT_STORAGE_AZURE_BLOB_ITEM
} from '../../../common/constants';
import { __ } from '../../../common/i18n';
import { TreeNode } from '../common/treeNode';

type BlobIter = PagedAsyncIterableIterator<({
        kind: 'prefix';
    } & BlobPrefix) | ({
        kind: 'blob';
    } & BlobItem), ContainerListBlobHierarchySegmentResponse>;

type BlobValue = ({
        kind: 'prefix';
    } & BlobPrefix) | ({
        kind: 'blob';
    } & BlobItem)

type BlobEntity = {
        done?: boolean | undefined;
        value: ({
            kind: 'prefix';
        } & BlobPrefix) | ({
            kind: 'blob';
        } & BlobItem);
    };

/**
 * PAI azure blob storage tree item.
 */
export class AzureBlobTreeItem extends TreeNode {
    public blobs?: TreeNode[];
    public client: ContainerClient;

    private blob: BlobValue;

    public constructor(blob: BlobValue, client: ContainerClient, parent: TreeNode) {
        super(blob.name, blob.kind === 'blob' ?
            TreeItemCollapsibleState.None : TreeItemCollapsibleState.Collapsed);
        this.contextValue = CONTEXT_STORAGE_AZURE_BLOB_ITEM;
        this.parent = parent;
        this.client = client;
        this.blob = blob;
    }

    public async getChildren(): Promise<TreeNode[] | undefined> {
        if (this.blob.kind === 'blob') {
            return undefined;
        } else if (this.blobs) {
            return this.blobs;
        }

        try {
            this.blobs = [];
            const iter: BlobIter = this.client.listBlobsByHierarchy('/', {
                prefix: <string> this.label
            });
            let blobItem: BlobEntity = await iter.next();
            while (!blobItem.done) {
                const blob: BlobValue = blobItem.value;
                this.blobs.push(new AzureBlobTreeItem(blob, this.client, this));
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

        return this.blobs;
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

        try {
            this.blobs = [];
            const prefix: string = '/';
            const iter: BlobIter = this.client.listBlobsByHierarchy(prefix);
            let blobItem: BlobEntity = await iter.next();
            while (!blobItem.done) {
                const blob: BlobValue = blobItem.value;
                this.blobs.push(new AzureBlobTreeItem(blob, this.client, this));
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

        return this.blobs;
    }
}
