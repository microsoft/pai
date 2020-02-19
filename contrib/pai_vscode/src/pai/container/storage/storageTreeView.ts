/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */

import { injectable } from 'inversify';
import {
    commands,
    window,
    workspace,
    Event,
    EventEmitter,
    TextDocument,
    TreeDataProvider,
    TreeItem,
    TreeView
} from 'vscode';

import {
    COMMAND_CONTAINER_STORAGE_BACK,
    COMMAND_CONTAINER_STORAGE_REFRESH,
    COMMAND_OPEN_STORAGE,
    COMMAND_STORAGE_CREATE_FOLDER,
    COMMAND_STORAGE_DELETE,
    COMMAND_STORAGE_DOWNLOAD,
    COMMAND_STORAGE_OPEN_FILE,
    COMMAND_STORAGE_UPLOAD_FILES,
    COMMAND_STORAGE_UPLOAD_FOLDERS,
    COMMAND_TREEVIEW_LOAD_MORE,
    CONTEXT_STORAGE_CLUSTER_ROOT,
    VIEW_CONTAINER_STORAGE
} from '../../../common/constants';
import { __ } from '../../../common/i18n';
import { getSingleton, Singleton } from '../../../common/singleton';
import { ClusterManager } from '../../clusterManager';
import { IPAICluster } from '../../utility/paiInterface';
import { RemoteFileEditor } from '../../utility/remoteFileEditor';
import { StorageTreeNode, TreeNode } from '../common/treeNode';
import { ClusterExplorerChildNode } from '../configurationTreeDataProvider';

import { ClusterStorageRootNode } from './clusterStorageTreeItem';
import { PersonalStorageRootNode } from './personalStorageTreeItem';

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
                async (node?: ClusterExplorerChildNode | IPAICluster) => this.openStorage(node)
            ),
            commands.registerCommand(
                COMMAND_STORAGE_DOWNLOAD,
                async (target: StorageTreeNode) => target.download()
            ),
            commands.registerCommand(
                COMMAND_STORAGE_UPLOAD_FILES,
                async (target: StorageTreeNode) => {
                    await target.uploadFile();
                    await this.refresh(target);
                }
            ),
            commands.registerCommand(
                COMMAND_STORAGE_DELETE,
                async (target: StorageTreeNode) => {
                    await target.delete();
                    await this.refresh(target.parent);
                }
            ),
            commands.registerCommand(
                COMMAND_STORAGE_UPLOAD_FOLDERS,
                async (target: StorageTreeNode) => {
                    await target.uploadFolder();
                    await this.refresh(target);
                }
            ),
            commands.registerCommand(
                COMMAND_STORAGE_CREATE_FOLDER,
                async (target: StorageTreeNode) => {
                    await target.createFolder();
                    await this.refresh(target);
                }
            ),
            commands.registerCommand(
                COMMAND_STORAGE_OPEN_FILE,
                async (target: StorageTreeNode) => target.openFile()
            ),
            commands.registerCommand(
                COMMAND_TREEVIEW_LOAD_MORE,
                async (target?: StorageTreeNode) => {
                    if (target) {
                        await target.loadMore();
                        this.onDidChangeTreeDataEmitter.fire(target);
                    }
                }
            ),
            workspace.onDidSaveTextDocument(
                async (doc: TextDocument) => {
                    const remoteFileEditor: RemoteFileEditor =
                        await getSingleton(RemoteFileEditor);
                    await remoteFileEditor.onDidSaveTextDocument(doc);
                }
            )
        );
        return this.refresh();
    }

    public async openStorage(node?: ClusterExplorerChildNode | IPAICluster): Promise<void> {
        let cluster: IPAICluster;
        if (!node) {
            const manager: ClusterManager = await getSingleton(ClusterManager);
            const index: number | undefined = await manager.pick();
            if (index === undefined) {
                return;
            }
            cluster = manager.allConfigurations[index];
        } else if (node instanceof ClusterExplorerChildNode) {
            cluster = (await getSingleton(ClusterManager)).allConfigurations[node.index];
        } else {
            cluster = node;
        }

        for (const currentNode of this.root) {
            if (currentNode.contextValue === CONTEXT_STORAGE_CLUSTER_ROOT) {
                const clusters: StorageTreeNode[] = await (<StorageTreeNode>currentNode).getChildren();
                for (const item of clusters) {
                    if (item.label === cluster.name!) {
                        void this.view.reveal(item, {
                            select: true,
                            focus: true
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

    public async refresh(element?: StorageTreeNode): Promise<void> {
        if (element) {
            await element.refresh();
            this.onDidChangeTreeDataEmitter.fire(element);
        } else {
            for (const item of this.root) {
                await (<StorageTreeNode>item).refresh();
            }
            this.onDidChangeTreeDataEmitter.fire();
        }
    }

    public async reset(): Promise<void> {
        this.initializeRoot();
        await this.refresh();
    }

    public initializeRoot(): void {
        this.root = [
            new ClusterStorageRootNode(),
            new PersonalStorageRootNode()
        ];
    }
}
