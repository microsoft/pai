/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */

import { IStorage } from 'openpai-js-sdk';
import { TreeItemCollapsibleState } from 'vscode';

import {
    CONTEXT_STORAGE_CLUSTER,
    CONTEXT_STORAGE_CLUSTER_ROOT,
    ICON_PAI
} from '../../../common/constants';
import { __ } from '../../../common/i18n';
import { Util } from '../../../common/util';
import { IPAICluster } from '../../utility/paiInterface';
import { LoadingState, TreeDataType } from '../common/treeDataEnum';
import { TreeNode } from '../common/treeNode';

import { AzureBlobRootItem } from './azureBlobTreeItem';
import { NFSTreeItem } from './nfsTreeItem';

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

    public constructor(type: TreeDataType, cluster: IPAICluster, index: number) {
        super('unknown', TreeItemCollapsibleState.Collapsed);
        if (type === TreeDataType.ClusterStorage) {
            this.label = cluster.name!;
            this.config = cluster;
            this.index = index;
            this.iconPath = Util.resolvePath(ICON_PAI);
            this.contextValue = CONTEXT_STORAGE_CLUSTER;
        }
    }

    public getChildren(): TreeNode[] {
        return this.storages.map(storage => {
            switch (storage.type) {
                case 'azureblob':
                    return new AzureBlobRootItem(storage, this);
                case 'azurefile':
                    return <TreeNode> {
                        label: 'Unsupport type.'
                    };
                case 'nfs':
                    return new NFSTreeItem(storage, this);
                case 'samba':
                    return <TreeNode> {
                        label: 'Unsupport type.'
                    };
                default:
                    return <TreeNode> {
                        label: 'Load failed.'
                    };
            }
        });
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