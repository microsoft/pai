/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */

import { injectable } from 'inversify';
import {
    commands,
    window,
    Event,
    EventEmitter,
    TreeDataProvider,
    TreeItem,
    TreeView
} from 'vscode';

import {
    COMMAND_CONTAINER_STORAGE_BACK,
    COMMAND_CONTAINER_STORAGE_REFRESH,
    COMMAND_OPEN_STORAGE,
    COMMAND_TREEVIEW_LOAD_MORE,
    CONTEXT_STORAGE_CLUSTER_ROOT,
    VIEW_CONTAINER_STORAGE
} from '../../../common/constants';
import { __ } from '../../../common/i18n';
import { getSingleton, Singleton } from '../../../common/singleton';
import { ClusterManager } from '../../clusterManager';
import { IPAICluster } from '../../utility/paiInterface';
import { StorageTreeNode, TreeNode } from '../common/treeNode';
import { ClusterExplorerChildNode } from '../configurationTreeDataProvider';

import { ClusterStorageRootNode } from './clusterStorageTreeItem';

/**
 * Contributes to the tree view of storage explorer.
 */
@injectable()
export class StorageTreeDataProvider extends Singleton implements TreeDataProvider<TreeNode> {
    public readonly view: TreeView<TreeNode>;
    public root: TreeNode[];
    public onDidChangeTreeData: Event<TreeNode>;

    private onDidChangeTreeDataEmitter: EventEmitter<TreeNode>;

    constructor() {
        super();
        this.onDidChangeTreeDataEmitter = new EventEmitter<TreeNode>();
        this.onDidChangeTreeData = this.onDidChangeTreeDataEmitter.event;
        this.root = [
            new ClusterStorageRootNode()
        ];
        this.initializeRoot();
        this.view = window.createTreeView(VIEW_CONTAINER_STORAGE, { treeDataProvider: this });
    }

    public async onActivate(): Promise<void> {
        this.context.subscriptions.push(
            commands.registerCommand(COMMAND_CONTAINER_STORAGE_REFRESH, element => this.refresh(element)),
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
            ),
            commands.registerCommand(
                COMMAND_TREEVIEW_LOAD_MORE,
                async (node?: StorageTreeNode) => {
                    if (node) {
                        await node.loadMore();
                        this.onDidChangeTreeDataEmitter.fire(node);
                    }
                }
            )
        );
        return this.refresh();
    }

    public async openStorage(cluster: IPAICluster): Promise<void> {
        for (const node of this.root) {
            if (node.contextValue === CONTEXT_STORAGE_CLUSTER_ROOT) {
                const clusters: StorageTreeNode[] = await (<StorageTreeNode>node).getChildren();
                for (const item of clusters) {
                    if (item.label === cluster.name!) {
                        void this.view.reveal(item, {
                            select: true,
                            focus: true,
                            expand: true
                        });
                    }
                }
            }
        }
    }

    public getTreeItem(element: TreeNode): TreeItem | Thenable<TreeItem> {
        return element;
    }

    public async getChildren(element?: TreeNode | undefined): Promise<TreeNode[] | undefined> {
        if (!element) {
            return this.root;
        } else {
            return (<StorageTreeNode>element).getChildren();
        }
    }

    public getParent(element: TreeNode): TreeNode | undefined {
        return element.parent;
    }

    public async refresh(element?: TreeNode): Promise<void> {
        if (element) {
            await (<StorageTreeNode>element).refresh();
            this.onDidChangeTreeDataEmitter.fire(element);
        } else {
            this.onDidChangeTreeDataEmitter.fire();
        }
    }

    public async reset(): Promise<void> {
        this.initializeRoot();
        await this.refresh();
    }

    public initializeRoot(): void {
        this.root = [
            new ClusterStorageRootNode()
        ];
    }
}
