/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */

import { Singleton } from './common/singleton';
import { TreeViewHelper } from './common/treeViewHelper';
import { UtilClass } from './common/util';
import { ClusterManager } from './pai/clusterManager';
import { ConfigurationTreeDataProvider } from './pai/configurationTreeDataProvider';
import { HDFSTreeDataProvider } from './pai/container/hdfsTreeView';
import { JobListTreeDataProvider } from './pai/container/jobListTreeView';
import { HDFS } from './pai/hdfs';
import { PAIJobManager } from './pai/paiJobManager';
import { PAIWebpages } from './pai/paiWebpages';
import { RecentJobManager } from './pai/recentJobManager';

export const allSingletonClasses: { new(...arg: any[]): Singleton }[] = [
    UtilClass,
    ClusterManager,
    RecentJobManager,
    TreeViewHelper,
    ConfigurationTreeDataProvider,
    PAIJobManager,
    PAIWebpages,
    HDFS,
    HDFSTreeDataProvider,
    JobListTreeDataProvider
];