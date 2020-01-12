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
    COMMAND_OPEN_HDFS,
    COMMAND_TREEVIEW_DOUBLECLICK,
    CONTEXT_HDFS_ROOT,
    CONTEXT_HDFS_SELECT_CLUSTER,
    CONTEXT_HDFS_SELECT_CLUSTER_ROOT,
    ICON_PAI
} from '../../../common/constants';
import { __ } from '../../../common/i18n';
import { Util } from '../../../common/util';
import { getClusterName } from '../../clusterManager';
import { IPAICluster } from '../../utility/paiInterface';

import { TreeNode } from './treeNode';

/**
 * Root node
 */
export class RootNode extends TreeNode {
    public readonly contextValue: string = CONTEXT_HDFS_ROOT;
    constructor(uri: Uri) {
        super(uri, TreeItemCollapsibleState.Expanded);
        this.label = uri.toString();
        this.iconPath = Util.resolvePath(ICON_PAI);
    }
}

/**
 * Cluster root node
 */
export class SelectClusterRootNode extends TreeNode {
    public readonly contextValue: string = CONTEXT_HDFS_SELECT_CLUSTER_ROOT;
    constructor() {
        super(__('treeview.hdfs.select-cluster.label'), TreeItemCollapsibleState.Expanded);
    }
}

/**
 * Cluster node (when no cluster is selected)
 */
export class SelectClusterNode extends TreeNode {
    public readonly contextValue: string = CONTEXT_HDFS_SELECT_CLUSTER;
    public readonly cluster: IPAICluster;
    constructor(cluster: IPAICluster, parent: TreeNode) {
        super(getClusterName(cluster));
        this.cluster = cluster;
        this.parent = parent;
        this.command = {
            title: __('treeview.node.openhdfs'),
            command: COMMAND_TREEVIEW_DOUBLECLICK,
            arguments: [COMMAND_OPEN_HDFS, this.cluster]
        };
        this.iconPath = Util.resolvePath(ICON_PAI);
    }
}
