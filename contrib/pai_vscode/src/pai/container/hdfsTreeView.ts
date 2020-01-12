/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */

import { injectable } from 'inversify';
import {
    commands, window, Event, EventEmitter, FileType,
    TreeDataProvider, TreeItem, TreeView, Uri
} from 'vscode';

import {
    COMMAND_CONTAINER_HDFS_BACK, COMMAND_CONTAINER_HDFS_DELETE, COMMAND_CONTAINER_HDFS_MKDIR, COMMAND_CONTAINER_HDFS_REFRESH,
    CONTEXT_HDFS_FOLDER, CONTEXT_HDFS_ROOT, CONTEXT_HDFS_SELECT_CLUSTER_ROOT,
    VIEW_CONTAINER_HDFS
} from '../../common/constants';
import { __ } from '../../common/i18n';
import { getSingleton, Singleton } from '../../common/singleton';
import { Util } from '../../common/util';
import { ClusterManager } from '../clusterManager';
import { HDFS, HDFSFileSystemProvider } from '../storage/hdfs';
import { IPAICluster } from '../utility/paiInterface';

import { FileNode } from './common/fileNode';
import { FolderNode } from './common/folderNode';
import { RootNode, SelectClusterNode, SelectClusterRootNode } from './common/rootNode';
import { TreeNode } from './common/treeNode';

type IFileList = [string, FileType][];

/**
 * Contributes to the tree view of HDFS explorer.
 */
@injectable()
export class HDFSTreeDataProvider extends Singleton implements TreeDataProvider<TreeNode> {
    public readonly view: TreeView<TreeNode>;
    public root: TreeNode;
    public onDidChangeTreeData: Event<TreeNode>;

    private onDidChangeTreeDataEmitter: EventEmitter<TreeNode>;

    private uri?: Uri;

    constructor() {
        super();
        this.onDidChangeTreeDataEmitter = new EventEmitter<TreeNode>();
        this.onDidChangeTreeData = this.onDidChangeTreeDataEmitter.event;
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
                        ([, type]) => type === FileType.Directory
                    ).sort(
                        ([name1], [name2]) => name1.localeCompare(name2)
                    ).map(
                        ([name]) => new FolderNode(Util.uriPathAppend(uri, name), element)
                    ),
                    ...res.filter(
                        ([, type]) => type === FileType.File
                    ).sort(
                        ([name1], [name2]) => name1.localeCompare(name2)
                    ).map(
                        ([name]) => new FileNode(Util.uriPathAppend(uri, name), element)
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
