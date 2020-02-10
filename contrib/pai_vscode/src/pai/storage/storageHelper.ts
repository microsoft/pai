/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */

import { injectable } from 'inversify';
import { IStorageConfig, OpenPAIClient } from 'openpai-js-sdk';

import { getSingleton, Singleton } from '../../common/singleton';
import { IPAICluster } from '../utility/paiInterface';

import { PersonalStorageManager } from './personalStorageManager';

export let StorageHelper: StorageHelperClass;

/**
 * Storage helper class
 */
@injectable()
export class StorageHelperClass extends Singleton {
    constructor() {
        super();
        StorageHelper = this;
    }

    public async getStorageMountPoints(cluster: IPAICluster): Promise<{storage: string, mountPoint: string}[]> {
        const client: OpenPAIClient = new OpenPAIClient({
            rest_server_uri: cluster.rest_server_uri,
            token: cluster.token,
            username: cluster.username,
            password: cluster.password,
            https: cluster.https
        });
        const storageConfigs: IStorageConfig[] = await client.storage.getConfig();
        const result: { storage: string, mountPoint: string}[] = [];
        storageConfigs.forEach(config => {
            config.mountInfos.forEach(mountInfo => {
                result.push({
                    storage: config.name,
                    mountPoint: mountInfo.mountPoint
                });
            });
        });

        return result;
    }

    public async getPersonalStorages(): Promise<string[]> {
        const personalStorageManager: PersonalStorageManager = await getSingleton(PersonalStorageManager);
        return personalStorageManager.allConfigurations.map(config => config.spn);
    }
}