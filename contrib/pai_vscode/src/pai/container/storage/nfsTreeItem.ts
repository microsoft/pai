/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */

import { IStorage } from 'openpai-js-sdk';
import { Command, TreeItemCollapsibleState } from 'vscode';

import {
    COMMAND_OPEN_NFS, COMMAND_TREEVIEW_DOUBLECLICK, CONTEXT_STORAGE_NFS
} from '../../../common/constants';

import { __ } from '../../../common/i18n';
import { TreeNode } from '../common/treeNode';

/**
 * PAI NFS storage tree item.
 */
export class NFSTreeItem extends TreeNode {
    public storage: IStorage;
    public nfsUrl: string;

    public constructor(storage: IStorage, parent: TreeNode) {
        super(storage.spn, TreeItemCollapsibleState.Collapsed);
        this.storage = storage;
        this.contextValue = CONTEXT_STORAGE_NFS;
        this.parent = parent;
        this.nfsUrl = `nfs://${storage.data.address}${storage.data.rootPath}`;
    }

    public getChildren(): TreeNode[] {
        const clipboardCommand: Command = {
            title: __('treeview.node.storage.clipboard'),
            command: COMMAND_TREEVIEW_DOUBLECLICK,
            arguments: [COMMAND_OPEN_NFS, this.storage]
        };

        return [
            <TreeNode> {
                parent: this,
                label: __('treeview.node.storage.server-type'),
                description: 'NFS'
            },
            <TreeNode> {
                parent: this,
                label: __('treeview.node.storage.mount-point'),
                description: '/data'
            },
            <TreeNode> {
                parent: this,
                label: 'URL',
                description: this.nfsUrl,
                command: clipboardCommand
            },
            <TreeNode> {
                parent: this,
                label: __('treeview.node.storage.clipboard'),
                command: clipboardCommand
            }
        ];
    }
}