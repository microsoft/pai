/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */

import { injectable } from 'inversify';
import { OpenPAIClient } from 'openpai-js-sdk';
import {
    commands,
    window,
    Event,
    EventEmitter,
    TreeDataProvider,
    TreeItem,
    TreeView,
    TreeItemCollapsibleState
} from 'vscode';

import {
    COMMAND_CONTAINER_STORAGE_BACK,
    COMMAND_CONTAINER_STORAGE_REFRESH,
    COMMAND_OPEN_STORAGE,
    CONTEXT_STORAGE_AZURE_BLOB,
    CONTEXT_STORAGE_AZURE_BLOB_FOLDER,
    CONTEXT_STORAGE_AZURE_BLOB_ITEM,
    CONTEXT_STORAGE_CLUSTER,
    CONTEXT_STORAGE_CLUSTER_ROOT,
    CONTEXT_STORAGE_NFS,
    VIEW_CONTAINER_STORAGE
} from '../../../common/constants';
import { __ } from '../../../common/i18n';
import { getSingleton, Singleton } from '../../../common/singleton';
import { Util } from '../../../common/util';
import { ClusterManager } from '../../clusterManager';
import { IPAICluster } from '../../utility/paiInterface';
import { LoadingState, TreeDataType } from '../common/treeDataEnum';
import { TreeNode } from '../common/treeNode';
import { ClusterExplorerChildNode } from '../configurationTreeDataProvider';

import { AzureBlobRootItem, AzureBlobTreeItem } from './azureBlobTreeItem';
import { NFSTreeItem } from './nfsTreeItem';
import { PAIClusterStorageRootItem, PAIPersonalStorageRootItem, PAIStorageTreeItem } from './storageTreeItem';

/**
 * Contributes to the tree view of storage explorer.
 */
@injectable()
export class StorageTreeDataProvider extends Singleton implements TreeDataProvider<TreeNode> {
    public readonly view: TreeView<TreeNode>;
    public root: TreeNode[];
    public onDidChangeTreeData: Event<TreeNode>;

    private onDidChangeTreeDataEmitter: EventEmitter<TreeNode>;
    private clusters: PAIStorageTreeItem[] = [];
    private clusterLoadError: boolean[] = [];

    constructor() {
        super();
        this.onDidChangeTreeDataEmitter = new EventEmitter<TreeNode>();
        this.onDidChangeTreeData = this.onDidChangeTreeDataEmitter.event;
        this.root = [
            new PAIClusterStorageRootItem(),
            new PAIPersonalStorageRootItem()
        ];
        this.view = window.createTreeView(VIEW_CONTAINER_STORAGE, { treeDataProvider: this });
    }

    public onActivate(): Promise<void> {
        this.context.subscriptions.push(
            commands.registerCommand(COMMAND_CONTAINER_STORAGE_REFRESH, () => this.refresh()),
            commands.registerCommand(COMMAND_CONTAINER_STORAGE_BACK, () => this.reset()),
            commands.registerCommand(
                COMMAND_OPEN_STORAGE,
                async (node?: ClusterExplorerChildNode | IPAICluster) => {
                    if (!node) {
                        const manager: ClusterManager = await getSingleton(ClusterManager);
                        const index: number | undefined = await manager.pick();
                        if (index === undefined) {
                            return;
                        }
                        await this.openStorage(manager.allConfigurations[index]);
                    } else if (node instanceof ClusterExplorerChildNode) {
                        await this.openStorage((await getSingleton(ClusterManager)).allConfigurations[node.index]);
                    } else {
                        await this.openStorage(node);
                    }
                }
            )
        );
        return this.refresh();
    }

    public async openStorage(cluster: IPAICluster): Promise<void> {
        await commands.executeCommand('PAIContainerStorage.focus');
        for (const node of this.clusters) {
            if (node.config!.name === cluster.name) {
                node.collapsibleState = TreeItemCollapsibleState.Expanded;
                // todo: should trigger expanded.
            }
        }
    }

    public getTreeItem(element: TreeNode): TreeItem | Thenable<TreeItem> {
        return element;
    }

    public async getChildren(element?: TreeNode | undefined): Promise<TreeNode[] | undefined> {
        if (!element) {
            return this.root;
        } else if (element.contextValue === CONTEXT_STORAGE_CLUSTER_ROOT) {
            return this.clusters;
        } else if (element.contextValue === CONTEXT_STORAGE_CLUSTER) {
            return (<PAIStorageTreeItem>element).getChildren();
        } else if (element.contextValue === CONTEXT_STORAGE_NFS) {
            return (<NFSTreeItem>element).getChildren();
        } else if (element.contextValue === CONTEXT_STORAGE_AZURE_BLOB) {
            return (<AzureBlobRootItem>element).getChildren();
        } else if (element.contextValue === CONTEXT_STORAGE_AZURE_BLOB_ITEM ||
                element.contextValue === CONTEXT_STORAGE_AZURE_BLOB_FOLDER) {
            return (<AzureBlobTreeItem>element).getChildren();
        }

        return undefined;
    }

    public getParent(element: TreeNode): TreeNode | undefined {
        return element.parent;
    }

    public async refresh(reload: boolean = true): Promise<void> {
        const allConfigurations: IPAICluster[] = (await getSingleton(ClusterManager)).allConfigurations;
        this.clusters = allConfigurations.map((config, i) =>
            new PAIStorageTreeItem(TreeDataType.ClusterStorage, config, i));
        if (this.clusterLoadError.length !== this.clusters.length) {
            this.clusterLoadError = new Array(this.clusters.length).fill(false);
        }
        if (reload) {
            void this.reloadStorages();
        }
        this.onDidChangeTreeDataEmitter.fire();
    }

    public async reset(): Promise<void> {
        this.root = [
            new PAIClusterStorageRootItem(),
            new PAIPersonalStorageRootItem()
        ];
        await this.refresh();
    }

    private async reloadStorages(index: number = -1): Promise<void> {
        const clusters: PAIStorageTreeItem[] = index !== -1 ? [this.clusters[index]] : this.clusters ;
        await Promise.all(clusters.map(async cluster => {
            cluster.loadingState = LoadingState.Loading;
            this.onDidChangeTreeDataEmitter.fire(cluster);
            try {
                const client: OpenPAIClient = new OpenPAIClient({
                    rest_server_uri: cluster.config!.rest_server_uri,
                    token: cluster.config!.token,
                    username: cluster.config!.username,
                    password: cluster.config!.password,
                    https: cluster.config!.https
                });
                cluster.storages = await client.storage.get();
                cluster.loadingState = LoadingState.Finished;
                this.clusterLoadError[cluster.index] = false;
            } catch (e) {
                if (!this.clusterLoadError[cluster.index]) {
                    Util.err('treeview.storage.error', [e.message || e]);
                    this.clusterLoadError[cluster.index] = true;
                }
                cluster.loadingState = LoadingState.Error;
            }
            this.onDidChangeTreeDataEmitter.fire(cluster);
        }));
    }
}
