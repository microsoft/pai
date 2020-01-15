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
    CONTEXT_HDFS_FOLDER
} from '../../../common/constants';

import { TreeNode } from './treeNode';

/**
 * Folder node
 */
export class FolderNode extends TreeNode {
    public readonly contextValue: string = CONTEXT_HDFS_FOLDER;
    constructor(uri: Uri, parent: TreeNode) {
        super(uri, TreeItemCollapsibleState.Collapsed);
        this.parent = parent;
    }
}
