/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */

import { TreeItemCollapsibleState } from 'vscode';

import { TreeNode } from '../common/treeNode';

/**
 * PAI storage tree item.
 */
export class PAIStorageTreeItem extends TreeNode {
    public readonly type: string;

    public constructor(type: string, label: string, collapsibleState?: TreeItemCollapsibleState) {
        super(label, collapsibleState);
        this.type = type;
    }
}