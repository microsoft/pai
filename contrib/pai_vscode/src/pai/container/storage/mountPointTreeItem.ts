/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */

import { IMountInfo, IStorageServer } from 'openpai-js-sdk';
import { TreeItemCollapsibleState, Uri } from 'vscode';

import {
    CONTEXT_STORAGE_MOUNTPOINT_ITEM
} from '../../../common/constants';
import { __ } from '../../../common/i18n';
import { IPAICluster } from '../../utility/paiInterface';
import { StorageTreeNode } from '../common/treeNode';

import { AzureBlobRootItem } from './azureBlobTreeItem';
import { NfsRootNode } from './NfsTreeItem';
import { SambaRootNode } from './SambaTreeItem';

/**
 * PAI storage mount point tree node.
 */
export class MountPointTreeNode extends StorageTreeNode {
    public contextValue: string = CONTEXT_STORAGE_MOUNTPOINT_ITEM;
    public data: StorageTreeNode;
    public cluster: IPAICluster;

    constructor(
        info: IMountInfo,
        cluster: IPAICluster,
        server: IStorageServer,
        parent?: StorageTreeNode,
        collapsibleState: TreeItemCollapsibleState = TreeItemCollapsibleState.Collapsed
    ) {
        super('Mount Point', parent, collapsibleState);
        this.description = info.mountPoint;

        this.cluster = cluster;
        this.data = this.initializeData(info, server);
    }

    public async refresh(): Promise<void> {
        return this.data.refresh();
    }

    public async getChildren(): Promise<StorageTreeNode[]> {
        return this.data.getChildren();
    }

    public async loadMore(): Promise<void> {
        await this.data.loadMore();
    }

    public async uploadFile(files?: Uri[]): Promise<void> {
        await this.data.uploadFile(files);
    }

    public async createFolder(folder?: string): Promise<void> {
        await this.data.createFolder(folder);
    }

    private initializeData(info: IMountInfo, server: IStorageServer): StorageTreeNode {
        switch (server.type) {
            case 'azureblob':
                return new AzureBlobRootItem(server, this.getRootPath(info, this.cluster), this);
            case 'azurefile':
                return new StorageTreeNode('Azure File');
            case 'nfs':
                return new NfsRootNode(server, this.getRootPath(info, this.cluster), this);
            case 'samba':
                return new SambaRootNode(server, this.getRootPath(info, this.cluster), this);
            default:
                return new StorageTreeNode('Unsupported storage');
        }
    }

    private getRootPath(info: IMountInfo, cluster: IPAICluster): string {
        const envs: Map<string, string> = new Map<string, string>([
            ['\${PAI_USER_NAME}', cluster.username!]
        ]);
        let path: string = info.path;
        for (const [key, value] of envs) {
            path = path.replace(key, value);
        }
        if (!path.endsWith('/')) {
            path = path + '/';
        }
        return path;
    }
}
