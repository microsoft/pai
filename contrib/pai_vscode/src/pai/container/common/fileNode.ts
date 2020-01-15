/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */

import {
    TreeItemCollapsibleState,
    Uri
} from 'vscode';

import {
    CONTEXT_HDFS_FILE
} from '../../../common/constants';

import { TreeNode } from './treeNode';

/**
 * File node
 */
export class FileNode extends TreeNode {
    public readonly contextValue: string = CONTEXT_HDFS_FILE;
    constructor(uri: Uri, parent: TreeNode) {
        super(uri, TreeItemCollapsibleState.None);
        this.parent = parent;
    }
}
