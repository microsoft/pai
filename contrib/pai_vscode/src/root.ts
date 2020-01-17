/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */

import { Singleton } from './common/singleton';
import { TreeViewHelper } from './common/treeViewHelper';
import { UtilClass } from './common/util';
import { ClusterManager } from './pai/clusterManager';
import { ConfigurationTreeDataProvider } from './pai/container/configurationTreeDataProvider';
import { HDFSTreeDataProvider } from './pai/container/hdfsTreeView';
import { JobListTreeDataProvider } from './pai/container/jobListTreeView';
import { StorageTreeDataProvider } from './pai/container/storage/storageTreeView';
import { PAIJobManager } from './pai/paiJobManager';
import { PAIWebpages } from './pai/paiWebpages';
import { RecentJobManager } from './pai/recentJobManager';
import { HDFS } from './pai/storage/hdfs';
import { NfsStorageManager } from './pai/storage/nfsStorageManager';
import { PersonalStorageManager } from './pai/storage/personalStorageManager';
import { RemoteFileEditor } from './pai/utility/remoteFileEditor';

export const allSingletonClasses: { new(...arg: any[]): Singleton }[] = [
    UtilClass,
    ClusterManager,
    RecentJobManager,
    TreeViewHelper,
    ConfigurationTreeDataProvider,
    PAIJobManager,
    PAIWebpages,
    HDFS,
    NfsStorageManager,
    PersonalStorageManager,
    HDFSTreeDataProvider,
    StorageTreeDataProvider,
    JobListTreeDataProvider,
    RemoteFileEditor
];
