/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */

import { injectable } from 'inversify';
import {
    window,
    Event,
    EventEmitter,
    TreeDataProvider,
    TreeItem,
    TreeView
} from 'vscode';

import {
    VIEW_CONTAINER_STORAGE
} from '../../../common/constants';
import { __ } from '../../../common/i18n';
import { Singleton } from '../../../common/singleton';
import { SelectClusterRootNode } from '../common/rootNode';
import { TreeNode } from '../common/treeNode';

/**
 * Contributes to the tree view of storage explorer.
 */
@injectable()
export class StorageTreeDataProvider extends Singleton implements TreeDataProvider<TreeNode> {
    public readonly view: TreeView<TreeNode>;
    public root: TreeNode;
    public onDidChangeTreeData: Event<TreeNode>;

    private onDidChangeTreeDataEmitter: EventEmitter<TreeNode>;

    constructor() {
        super();
        this.onDidChangeTreeDataEmitter = new EventEmitter<TreeNode>();
        this.onDidChangeTreeData = this.onDidChangeTreeDataEmitter.event;
        this.root = new SelectClusterRootNode();
        this.view = window.createTreeView(VIEW_CONTAINER_STORAGE, { treeDataProvider: this });
    }

    public async onActivate(): Promise<void> {
        this.refresh();
    }

    public getTreeItem(element: TreeNode): TreeItem | Thenable<TreeItem> {
        return element;
    }

    public async getChildren(element?: TreeNode | undefined): Promise<TreeNode[] | undefined> {
        if (!element) {
            return [this.root];
        } else {
            return undefined;
        }
    }

    public getParent(element: TreeNode): TreeNode | undefined {
        return element.parent;
    }

    public refresh(node?: TreeNode): void {
        this.onDidChangeTreeDataEmitter.fire(node);
    }

    public reset(): void {
        this.root = new SelectClusterRootNode();
        this.refresh();
        void this.view.reveal(this.root);
    }
}
