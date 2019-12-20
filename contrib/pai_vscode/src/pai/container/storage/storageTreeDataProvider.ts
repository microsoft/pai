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
    TreeItemCollapsibleState,
    TreeView
} from 'vscode';

import {
    COMMAND_CONTAINER_STORAGE_BACK,
    COMMAND_CONTAINER_STORAGE_REFRESH,
    VIEW_CONTAINER_STORAGE
} from '../../../common/constants';
import { __ } from '../../../common/i18n';
import { Singleton } from '../../../common/singleton';
import { TreeNode } from '../common/treeNode';

// tslint:disable-next-line: completed-docs
export class TestNode extends TreeNode {
    constructor(label: string) {
        super(label, TreeItemCollapsibleState.Collapsed);
        this.contextValue = 'dddd';
    }

    get description(): string {
        return 'kitty';
    }

    get tooltip(): string {
        return 'hello';
    }
}

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
        this.root = new TestNode('test');
        this.view = window.createTreeView(VIEW_CONTAINER_STORAGE, { treeDataProvider: this });
    }

    public async onActivate(): Promise<void> {
        this.context.subscriptions.push(
            commands.registerCommand(COMMAND_CONTAINER_STORAGE_REFRESH, () => this.refresh()),
            commands.registerCommand(COMMAND_CONTAINER_STORAGE_BACK, () => this.reset())
        );
        this.refresh();
    }

    public getTreeItem(element: TreeNode): TreeItem | Thenable<TreeItem> {
        return element;
    }

    public async getChildren(element?: TreeNode | undefined): Promise<TreeNode[] | undefined> {
        if (!element) {
            return [this.root];
        } else {
            if (element.label === 'test') {
                const child: TreeNode = new TestNode('child');
                child.parent = element;
                return [ child ];
            } else {
                return undefined;
            }
        }
    }

    public getParent(element: TreeNode): TreeNode | undefined {
        return element.parent;
    }

    public refresh(node?: TreeNode): void {
        this.onDidChangeTreeDataEmitter.fire(node);
    }

    public reset(): void {
        this.root = new TestNode('test');
        this.refresh();
        void this.view.reveal(this.root);
    }
}
