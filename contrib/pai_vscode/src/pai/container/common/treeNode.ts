/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */

import {
    TreeItem
} from 'vscode';

/**
 * Abstract tree node
 */
export abstract class TreeNode extends TreeItem {
    public parent?: TreeNode;
}
