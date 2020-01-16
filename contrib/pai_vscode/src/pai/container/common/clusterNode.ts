/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */

import { TreeItem, TreeItemCollapsibleState} from 'vscode';

import {
    CONTEXT_JOBLIST_CLUSTER,
    ICON_PAI
} from '../../../common/constants';
import { __ } from '../../../common/i18n';
import { Util } from '../../../common/util';
import { getClusterName } from '../../clusterManager';
import { IPAICluster } from '../../utility/paiInterface';

/**
 * Root node representing PAI cluster
 */
export class ClusterNode extends TreeItem {
    public readonly index: number;
    public constructor(configuration: IPAICluster, index: number) {
        super(getClusterName(configuration), TreeItemCollapsibleState.Collapsed);
        this.index = index;
        this.iconPath = Util.resolvePath(ICON_PAI);
        this.contextValue = CONTEXT_JOBLIST_CLUSTER;
    }
}
