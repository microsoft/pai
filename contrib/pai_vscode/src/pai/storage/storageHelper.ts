/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */

import { injectable } from 'inversify';
import { IStorageConfig, OpenPAIClient } from 'openpai-js-sdk';
import * as path from 'path';
import { Uri } from 'vscode';

import { delay, getSingleton, Singleton } from '../../common/singleton';
import { StorageTreeNode } from '../container/common/treeNode';
import { StorageTreeDataProvider } from '../container/storage/storageTreeView';
import { IPAICluster, IUploadConfig } from '../utility/paiInterface';

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

    public async getStorages(cluster: IPAICluster): Promise<string[]> {
        const client: OpenPAIClient = new OpenPAIClient({
            rest_server_uri: cluster.rest_server_uri,
            token: cluster.token,
            username: cluster.username,
            password: cluster.password,
            https: cluster.https
        });
        const storageConfigs: IStorageConfig[] = await client.storage.getConfig();
        return storageConfigs.map(x => x.name);
    }

    public async getPersonalStorages(): Promise<string[]> {
        const personalStorageManager: PersonalStorageManager = await getSingleton(PersonalStorageManager);
        return personalStorageManager.allConfigurations.map(config => config.spn);
    }

    public async getFolder(baseFolder: StorageTreeNode, target: string): Promise<StorageTreeNode> {
        for (const name of target.split('/')) {
            baseFolder = (await baseFolder.getChildren()).find(child => child.label === name)!;
        }
        return baseFolder;
    }

    public async createFolder(
        uploadConfig: IUploadConfig, clusterName: string, baseFolder: string
    ): Promise<StorageTreeNode> {
        const treeView: StorageTreeDataProvider = await getSingleton(StorageTreeDataProvider);
        let targetNode: StorageTreeNode | undefined;
        if (uploadConfig.storageType === 'cluster') {
            const clusterRoot: StorageTreeNode = <StorageTreeNode>(await treeView.getChildren())![0];
            const clusterNode: StorageTreeNode = (await clusterRoot.getChildren()).find(child => child.label === clusterName)!;
            const storageNode: StorageTreeNode = (await clusterNode.getChildren()).find(child => child.label === uploadConfig.storageName)!;
            targetNode = (await storageNode.getChildren()).find(child => child.description === uploadConfig.storageMountPoint);
        } else {
            const personalRoot: StorageTreeNode = <StorageTreeNode>(await treeView.getChildren())![1];
            targetNode = (await personalRoot.getChildren()).find(child => child.label === uploadConfig.storageName)!;
        }

        await targetNode!.createFolder(baseFolder);
        await treeView.refresh(targetNode);
        return targetNode!;
    }

    public async uploadFile(
        uploadConfig: IUploadConfig, clusterName: string, jobName: string, file: Uri, target: string
    ): Promise<void> {
        const treeView: StorageTreeDataProvider = await getSingleton(StorageTreeDataProvider);
        const dirname: string = path.dirname(target);
        const folderName: string = path.join(jobName, dirname).replace(/\\/g, '/');
        const baseNode: StorageTreeNode =
            await this.createFolder(uploadConfig, clusterName, folderName);
        let targetNode: StorageTreeNode = await this.getFolder(baseNode, folderName);
        for (let i: number = 0; i < 10 && targetNode === undefined; ++i) {
            await delay(100);
            targetNode = await this.getFolder(baseNode, folderName);
        }
        try {
            await targetNode.uploadFile([file]);
            await treeView.refresh(targetNode);
        } catch (err) {
            console.log(err);
            throw err;
        }
    }
}
