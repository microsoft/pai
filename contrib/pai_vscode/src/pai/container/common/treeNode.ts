/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */

import {
    TreeItem, TreeItemCollapsibleState
} from 'vscode';
import { CONTEXT_STORAGE_LOAD_MORE, COMMAND_TREEVIEW_LOAD_MORE, COMMAND_TREEVIEW_DOUBLECLICK } from '../../../common/constants';
import { __ } from '../../../common/i18n';

/**
 * Abstract tree node
 */
export abstract class TreeNode extends TreeItem {
    public parent?: TreeNode;
}

/**
 * Storage tree node base
 */
export class StorageTreeNode extends TreeNode {
    public static pageSize: number = 10;
    public parent?: StorageTreeNode;

    protected children: StorageTreeNode[] = [];
    protected initialized: boolean = false;

    constructor(label: string, parent?: StorageTreeNode, collapsibleState?: TreeItemCollapsibleState) {
        super(label, collapsibleState);
        this.parent = parent;
    }

    /**
     * Get children.
     */
    public async getChildren(): Promise<StorageTreeNode[]> {
        if (!this.initialized) {
            await this.refresh();
            this.initialized = true;
        }
        return this.children;
    }

    /**
     * Get parent.
     */
    public getParent(): StorageTreeNode | undefined {
        return this.parent;
    }

    /**
     * Refresh.
     */
    public async refresh(): Promise<void> { }

    /**
     * Load more items.
     */
    public async loadMore(): Promise<void> { }
}

/**
 * Storage load more tree node.
 */
export class StorageLoadMoreTreeNode extends StorageTreeNode {
    public contextValue: string = CONTEXT_STORAGE_LOAD_MORE;

    constructor(parent: StorageTreeNode) {
        super('Load More...', parent, TreeItemCollapsibleState.None);
        this.command = {
            title: __('treeview.node.storage.load-more'),
            command: COMMAND_TREEVIEW_DOUBLECLICK,
            arguments: [COMMAND_TREEVIEW_LOAD_MORE, this.parent]
        };
    }
}