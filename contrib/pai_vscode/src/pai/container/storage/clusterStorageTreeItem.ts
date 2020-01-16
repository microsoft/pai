/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */

import { IStorageConfig, IStorageServer, OpenPAIClient } from 'openpai-js-sdk';
import { TreeItemCollapsibleState } from 'vscode';

import {
    CONTEXT_STORAGE_CLUSTER_ITEM,
    CONTEXT_STORAGE_CLUSTER_ROOT,
    ICON_PAI
} from '../../../common/constants';
import { __ } from '../../../common/i18n';
import { getSingleton } from '../../../common/singleton';
import { Util } from '../../../common/util';
import { ClusterManager } from '../../clusterManager';
import { IPAICluster } from '../../utility/paiInterface';
import { StorageTreeNode } from '../common/treeNode';

import { TeamStorageTreeNode } from './teamStorageTreeItem';

/**
 * PAI cluster storage tree node.
 */
export class ClusterStorageTreeNode extends StorageTreeNode {
    public readonly contextValue: string = CONTEXT_STORAGE_CLUSTER_ITEM;

    private cluster: IPAICluster;

    constructor(
        cluster: IPAICluster,
        parent?: StorageTreeNode,
        collapsibleState: TreeItemCollapsibleState = TreeItemCollapsibleState.Collapsed
    ) {
        super(cluster.name!, parent, collapsibleState);
        this.iconPath = Util.resolvePath(ICON_PAI);
        this.cluster = cluster;
    }

    public async refresh(): Promise<void> {
        try {
            const client: OpenPAIClient = new OpenPAIClient({
                rest_server_uri: this.cluster.rest_server_uri,
                token: this.cluster.token,
                username: this.cluster.username,
                password: this.cluster.password,
                https: this.cluster.https
            });
            const storageServers: Map<string, IStorageServer> =
                new Map((await client.storage.getServer()).map(server => [server.spn, server]));
            const storageConfigs: IStorageConfig[] = await client.storage.getConfig();
            this.children = storageConfigs.map(config =>
                new TeamStorageTreeNode(config, storageServers, this.cluster, client, this));
        } catch (e) {
            Util.err('treeview.storage.error', [e.message || e]);
        }
    }
}

/**
 * PAI cluster storage root node.
 */
export class ClusterStorageRootNode extends StorageTreeNode {
    public readonly contextValue: string = CONTEXT_STORAGE_CLUSTER_ROOT;

    constructor() {
        super(__('treeview.storage.cluster-root.label'), undefined, TreeItemCollapsibleState.Expanded);
    }

    public async refresh(): Promise<void> {
        const clusterManager: ClusterManager = await getSingleton(ClusterManager);
        const clusters: IPAICluster[] = clusterManager.allConfigurations;

        this.children = clusters.map(cluster => new ClusterStorageTreeNode(cluster, this));
    }
}
