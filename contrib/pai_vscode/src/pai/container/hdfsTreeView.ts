/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */
/* tslint:disable:max-classes-per-file */

import { injectable } from 'inversify';
import {
    commands, window, Event, EventEmitter, FileType,
    TreeDataProvider, TreeItem, TreeItemCollapsibleState,
    TreeView, Uri
} from 'vscode';

import {
    COMMAND_CONTAINER_HDFS_BACK, COMMAND_CONTAINER_HDFS_DELETE, COMMAND_CONTAINER_HDFS_MKDIR, COMMAND_CONTAINER_HDFS_REFRESH,
    COMMAND_OPEN_HDFS, COMMAND_TREEVIEW_DOUBLECLICK,
    CONTEXT_HDFS_FILE, CONTEXT_HDFS_FOLDER, CONTEXT_HDFS_ROOT, CONTEXT_HDFS_SELECT_CLUSTER, CONTEXT_HDFS_SELECT_CLUSTER_ROOT,
    ICON_PAI, VIEW_CONTAINER_HDFS
} from '../../common/constants';
import { __ } from '../../common/i18n';
import { getSingleton, Singleton } from '../../common/singleton';
import { Util } from '../../common/util';

import { getClusterName, ClusterManager } from '../clusterManager';
import { HDFS, HDFSFileSystemProvider } from '../hdfs';
import { IPAICluster } from '../paiInterface';

type IFileList = [string, FileType][];

/**
 * Abstract tree node
 */
abstract class TreeNode extends TreeItem {
    public parent?: TreeNode;
}

/**
 * File node
 */
class FileNode extends TreeNode {
    public readonly contextValue: string = CONTEXT_HDFS_FILE;
    constructor(uri: Uri, parent: TreeNode) {
        super(uri, TreeItemCollapsibleState.None);
        this.parent = parent;
    }
}

/**
 * Folder node
 */
class FolderNode extends TreeNode {
    public readonly contextValue: string = CONTEXT_HDFS_FOLDER;
    constructor(uri: Uri, parent: TreeNode) {
        super(uri, TreeItemCollapsibleState.Collapsed);
        this.parent = parent;
    }
}

/**
 * Root node
 */
class RootNode extends TreeNode {
    public readonly contextValue: string = CONTEXT_HDFS_ROOT;
    constructor(uri: Uri) {
        super(uri, TreeItemCollapsibleState.Expanded);
        this.label = uri.toString();
        this.iconPath = Util.resolvePath(ICON_PAI);
    }
}

/**
 * Cluster root node
 */
class SelectClusterRootNode extends TreeNode {
    public readonly contextValue: string = CONTEXT_HDFS_SELECT_CLUSTER_ROOT;
    constructor() {
        super(__('treeview.hdfs.select-cluster.label'), TreeItemCollapsibleState.Expanded);
    }
}

/**
 * Cluster node (when no cluster is selected)
 */
class SelectClusterNode extends TreeNode {
    public readonly contextValue: string = CONTEXT_HDFS_SELECT_CLUSTER;
    public readonly cluster: IPAICluster;
    constructor(cluster: IPAICluster, parent: TreeNode) {
        super(getClusterName(cluster));
        this.cluster = cluster;
        this.parent = parent;
        this.command = {
            title: __('treeview.node.openhdfs'),
            command: COMMAND_TREEVIEW_DOUBLECLICK,
            arguments: [COMMAND_OPEN_HDFS, this.cluster]
        };
        this.iconPath = Util.resolvePath(ICON_PAI);
    }
}

/**
 * Contributes to the tree view of cluster configurations
 */
@injectable()
export class HDFSTreeDataProvider extends Singleton implements TreeDataProvider<TreeNode> {
    public readonly view: TreeView<TreeNode>;
    public root: TreeNode;

    private onDidChangeTreeDataEmitter: EventEmitter<TreeNode> = new EventEmitter<TreeNode>();
    public onDidChangeTreeData: Event<TreeNode> = this.onDidChangeTreeDataEmitter.event; // tslint:disable-line

    private uri?: Uri;

    constructor() {
        super();
        this.root = new SelectClusterRootNode();
        this.view = window.createTreeView(VIEW_CONTAINER_HDFS, { treeDataProvider: this });
    }

    public async onActivate(): Promise<void> {
        this.context.subscriptions.push(
            commands.registerCommand(COMMAND_CONTAINER_HDFS_REFRESH, () => this.refresh()),
            commands.registerCommand(COMMAND_CONTAINER_HDFS_BACK, () => this.reset()),
            commands.registerCommand(COMMAND_CONTAINER_HDFS_DELETE, async (node: TreeItem) => {
                await (await getSingleton(HDFS)).provider!.delete(node.resourceUri!, { recursive: true });
            }),
            commands.registerCommand(COMMAND_CONTAINER_HDFS_MKDIR, async (node: TreeItem) => {
                const res: string | undefined = await window.showInputBox({
                    prompt: __('container.hdfs.mkdir.prompt')
                });
                if (res === undefined) {
                    Util.warn('container.hdfs.mkdir.cancelled');
                } else {
                    await (await getSingleton(HDFS)).provider!.createDirectory(Util.uriPathAppend(node.resourceUri!, res));
                }
            })
        );
        this.refresh();
        (await getSingleton(HDFS)).provider!.onDidChangeFile(() => this.refresh());
    }

    public reset(): void {
        this.uri = undefined;
        this.root = new SelectClusterRootNode();
        this.refresh();
        void this.view.reveal(this.root);
    }

    public setUri(uri?: Uri): void {
        if (uri === undefined) {
            this.reset();
        } else {
            this.uri = uri;
            this.root = new RootNode(this.uri);
            this.refresh();
            void this.view.reveal(this.root);
        }
    }

    public refresh(node?: TreeNode): void {
        this.onDidChangeTreeDataEmitter.fire(node);
    }

    public getTreeItem(element: TreeNode): TreeNode {
        return element;
    }

    public async getChildren(element?: TreeNode): Promise<TreeNode[] | undefined> {
        if (!this.uri) {
            if (!element) {
                return [this.root];
            } else if (element.contextValue === CONTEXT_HDFS_SELECT_CLUSTER_ROOT) {
                const allConfigurations: IPAICluster[] = (await getSingleton(ClusterManager)).allConfigurations;
                return allConfigurations.filter(
                    conf => !!conf.webhdfs_uri
                ).map(
                    conf => new SelectClusterNode(conf, element)
                );
            } else {
                return;
            }
        } else {
            if (!element) {
                return [this.root];
            } else if (element.contextValue === CONTEXT_HDFS_FOLDER || element.contextValue === CONTEXT_HDFS_ROOT) {
                const provider: HDFSFileSystemProvider | undefined = (await getSingleton(HDFS)).provider;
                if (!provider) {
                    return;
                }
                const uri: Uri = element.resourceUri!;
                const res: IFileList = await provider.readDirectory(uri);
                return [
                    ...res.filter(
                        ([name, type]) => type === FileType.Directory
                    ).sort(
                        ([name1, type1], [name2, type2]) => name1.localeCompare(name2)
                    ).map(
                        ([name, type]) => new FolderNode(Util.uriPathAppend(uri, name), element)
                    ),
                    ...res.filter(
                        ([name, type]) => type === FileType.File
                    ).sort(
                        ([name1, type1], [name2, type2]) => name1.localeCompare(name2)
                    ).map(
                        ([name, type]) => new FileNode(Util.uriPathAppend(uri, name), element)
                    )
                ];
            } else {
                return;
            }

        }
    }

    public getParent(element: TreeNode): TreeNode | undefined {
        return element.parent;
    }
}