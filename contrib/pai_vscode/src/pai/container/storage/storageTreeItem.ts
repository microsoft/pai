/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */

import { IPAICluster, IStorage } from 'openpai-js-sdk';
import { TreeItemCollapsibleState } from 'vscode';

import { CONTEXT_STORAGE_CLUSTER_ROOT } from '../../../common/constants';
import { __ } from '../../../common/i18n';
import { LoadingState, TreeDataType } from '../common/treeDataEnum';
import { TreeNode } from '../common/treeNode';

/**
 * PAI storage tree item.
 */
export class PAIStorageTreeItem extends TreeNode {
    public type: TreeDataType = TreeDataType.ClusterStorage;
    public config?: IPAICluster;
    public index: number = -1;
    public loadingState: LoadingState = LoadingState.Loading;
    public storages: IStorage[] = [];

    public shownAmount: number = 0;
    public lastShownAmount?: number;

    public constructor(label: string, collapsibleState?: TreeItemCollapsibleState) {
        super(label, collapsibleState);
    }
}

/**
 * PAI cluster storage root item.
 */
export class PAIClusterStorageRootItem extends TreeNode {
    public readonly contextValue: string = CONTEXT_STORAGE_CLUSTER_ROOT;
    constructor() {
        super(__('treeview.storage.cluster-root.label'), TreeItemCollapsibleState.Expanded);
    }
}