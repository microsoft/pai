/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */

import { Singleton } from './common/singleton';
import { UtilClass } from './common/util';
import { ClusterManager } from './pai/clusterManager';
import { ConfigurationTreeDataProvider } from './pai/configurationTreeDataProvider';
import { HDFS } from './pai/hdfs';
import { PAIJobManager } from './pai/paiJobManager';
import { PAIWebpages } from './pai/paiWebpages';

export const allSingletonClasses: { new(...arg: any[]): Singleton }[] = [
    UtilClass,
    ClusterManager,
    ConfigurationTreeDataProvider,
    PAIJobManager,
    PAIWebpages,
    HDFS
];