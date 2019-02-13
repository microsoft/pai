/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */
import { injectable } from 'inversify';
import { commands, Event, EventEmitter, FileType, TreeDataProvider, TreeItem, TreeItemCollapsibleState, Uri, window } from 'vscode';

import { getSingleton, Singleton } from '../../common/singleton';
import { IPAICluster } from '../paiInterface';
import { getClusterName, ClusterManager } from '../clusterManager';
import { CONTEXT_HDFS_SELECT_CLUSTER, CONTEXT_HDFS_FILE, CONTEXT_HDFS_FOLDER, CONTEXT_HDFS_SELECT_CLUSTER_ROOT, VIEW_CONTAINER_HDFS, COMMAND_CONTAINER_HDFS_REFRESH, COMMAND_OPEN_HDFS, COMMAND_TREEVIEW_DOUBLECLICK, CONTEXT_HDFS_ROOT, ICON_PAI } from '../../common/constants';
import { __ } from '../../common/i18n';
import { HDFS, HDFSFileSystemProvider } from '../hdfs';
import { Util } from '../../common/util';

type IFileList = [string, FileType][];

class TreeNode extends TreeItem {
  public parent?: TreeNode;
}

/**
 * File node
 */
class FileNode extends TreeNode {
    public readonly contextValue = CONTEXT_HDFS_FILE;
    constructor(uri: Uri, parent: TreeNode) {
        super(uri, TreeItemCollapsibleState.None);
        this.parent = parent;
    }
}

/**
 * Folder node
 */
class FolderNode extends TreeNode {
    public readonly contextValue = CONTEXT_HDFS_FOLDER;
    constructor(uri: Uri, parent: TreeNode) {
        super(uri, TreeItemCollapsibleState.Collapsed);
        this.parent = parent;
    }
}

/**
 * Root node
 */
class RootNode extends TreeNode {
    public readonly contextValue = CONTEXT_HDFS_ROOT;
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
    public readonly contextValue = CONTEXT_HDFS_SELECT_CLUSTER_ROOT;
    constructor() {
        super(__('treeview.hdfs.select-cluster.label'), TreeItemCollapsibleState.Expanded);
    }
}

/**
 * Cluster node (when no cluster is selected)
 */
class SelectClusterNode extends TreeNode {
    public readonly contextValue = CONTEXT_HDFS_SELECT_CLUSTER;
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
    private onDidChangeTreeDataEmitter: EventEmitter<TreeNode> = new EventEmitter<TreeNode>();
    public onDidChangeTreeData: Event<TreeNode> = this.onDidChangeTreeDataEmitter.event; // tslint:disable-line

    private uri?: Uri;

    constructor() {
        super();
        this.context.subscriptions.push(
            commands.registerCommand(COMMAND_CONTAINER_HDFS_REFRESH, () => this.refresh()),
            window.registerTreeDataProvider(VIEW_CONTAINER_HDFS, this)
        );
    }

    public async setUri(uri: Uri) {
      this.uri = uri;
      this.refresh();
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
                return [new SelectClusterRootNode()];
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
                return [new RootNode(this.uri)];
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
                    ),
                ];
            } else {
                return;
            }

        }
    }

    public getParent(element: TreeNode): TreeNode | undefined {
        return element.parent;
    }

    public async onActivate(): Promise<void> {
        this.refresh();
    }
}