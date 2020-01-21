/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */

import { injectable } from 'inversify';

import { Singleton } from '../../common/singleton';
import { IPAICluster } from '../utility/paiInterface';



/**
 * Source code auto upload management.
 */
@injectable()
export class AutoUploadManager extends Singleton {
    public async ensureSetting(cluster: IPAICluster): Promise<void> {

    }

    public async upload(cluster: IPAICluster): Promise<void> {

    }
}
