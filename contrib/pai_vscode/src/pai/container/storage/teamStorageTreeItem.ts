/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */

import { IStorageConfig, IStorageServer, OpenPAIClient } from 'openpai-js-sdk';
import { TreeItemCollapsibleState } from 'vscode';

import {
    CONTEXT_STORAGE_TEAM_ITEM, ICON_STORAGE
} from '../../../common/constants';
import { __ } from '../../../common/i18n';
import { Util } from '../../../common/util';
import { IPAICluster } from '../../utility/paiInterface';
import { StorageTreeNode } from '../common/treeNode';

import { MountPointTreeNode } from './mountPointTreeItem';

/**
 * PAI storage mount point tree node.
 */
export class TeamStorageTreeNode extends StorageTreeNode {
    public readonly contextValue: string = CONTEXT_STORAGE_TEAM_ITEM;

    private config: IStorageConfig;
    private servers: Map<string, IStorageServer>;
    private client: OpenPAIClient;
    private cluster: IPAICluster;

    constructor(
        config: IStorageConfig,
        servers: Map<string, IStorageServer>,
        cluster: IPAICluster,
        client: OpenPAIClient,
        parent?: StorageTreeNode,
        collapsibleState: TreeItemCollapsibleState = TreeItemCollapsibleState.Collapsed
    ) {
        super(config.name, parent, collapsibleState);
        this.config = config;
        this.servers = servers;
        this.client = client;
        this.cluster = cluster;
        this.iconPath = Util.resolvePath(ICON_STORAGE);
    }

    public loadMountPoints(): void {
        try {
            this.children = this.config.mountInfos.map(mountPoint =>
                new MountPointTreeNode(mountPoint, this.cluster, this.servers.get(mountPoint.server)!, this));
        } catch (e) {
            Util.err('treeview.storage.error', [e.message || e]);
        }
    }

    public async refresh(): Promise<void> {
        try {
            this.config = await this.client.storage.getConfigByName(this.config.name);
            this.loadMountPoints();
        } catch (e) {
            Util.err('treeview.storage.error', [e.message || e]);
        }
    }
}
