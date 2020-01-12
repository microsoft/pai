/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */

import { injectable } from 'inversify';
import { IStorageServer } from 'openpai-js-sdk';
import { commands, window } from 'vscode';

import {
    COMMAND_ADD_PERSONAL_STORAGE, COMMAND_DELETE_PERSONAL_STORAGE, COMMAND_EDIT_PERSONAL_STORAGE} from '../../common/constants';
import { __ } from '../../common/i18n';
import { getSingleton, Singleton } from '../../common/singleton';
import { Util } from '../../common/util';
import { PersonalStorageRootNode, PersonalStorageTreeNode } from '../container/storage/personalStorageTreeItem';
import { StorageTreeDataProvider } from '../container/storage/storageTreeView';

export interface IStorageConfiguration {
    readonly version: string;
    storages: IStorageServer[];
}

/**
 * Personal storage management module
 */
@injectable()
export class PersonalStorageManager extends Singleton {
    private static readonly CONF_KEY: string = 'openpai.personal.storage';
    private static readonly default: IStorageConfiguration = {
        version: '0.0.1',
        storages: []
    };
    private configuration: IStorageConfiguration | undefined;

    constructor() {
        super();
    }

    public get allConfigurations(): IStorageServer[] {
        return this.configuration!.storages;
    }

    public async onActivate(): Promise<void> {
        this.context.subscriptions.push(
            commands.registerCommand(
                COMMAND_ADD_PERSONAL_STORAGE,
                async (node: PersonalStorageRootNode) => {
                    await this.add();
                    const provider: StorageTreeDataProvider =
                        await getSingleton(StorageTreeDataProvider);
                    await provider.refresh(node);
                }),
            commands.registerCommand(
                COMMAND_EDIT_PERSONAL_STORAGE,
                async (node: PersonalStorageTreeNode) => {
                    await this.edit(node.index);
                    const provider: StorageTreeDataProvider =
                        await getSingleton(StorageTreeDataProvider);
                    await provider.refresh(node);
                }),
            commands.registerCommand(
                COMMAND_DELETE_PERSONAL_STORAGE,
                async (node: PersonalStorageTreeNode) => {
                    await this.delete(node.index);
                    const provider: StorageTreeDataProvider =
                        await getSingleton(StorageTreeDataProvider);
                    await provider.refresh(node.getParent());
                })
        );
        this.configuration = this.context.globalState.get<IStorageConfiguration>(
            PersonalStorageManager.CONF_KEY) || PersonalStorageManager.default;
        try {
            await this.validateConfiguration();
        } catch (err) {
            Util.err([err.message || err]);
        }
    }

    public async validateConfiguration(): Promise<void> {
        const validateResult: string | undefined =
            await Util.validateJSON(this.configuration!, 'pai_personal_storage.schema.json');
        if (validateResult) {
            throw validateResult;
        }
    }

    public async add(): Promise<void> {
        const name: string | undefined = await window.showInputBox({
            prompt: __('cluster.add.personal.storage.prompt'),
            validateInput: (val: string): string => {
                if (!val) {
                    return __('cluster.add.personal.storage.empty');
                }
                if (val.includes('/')) {
                    return __('cluster.add.personal.storage.invalidchar');
                }
                return '';
            }
        });
        if (!name) {
            return;
        }

        const config: IStorageServer = {
            spn: name,
            type: 'azureblob',
            data: {
                dataStore: 'dataStore',
                containerName: '<container name>',
                accountName: '<account name>',
                key: '<key>'
            },
            extension: { }
        };

        await this.edit(this.allConfigurations.length, config);
    }

    public async edit(index: number, config?: IStorageServer): Promise<void> {
        const original: IStorageServer = this.allConfigurations[index] || config;
        const editResult: IStorageServer | undefined = await Util.editJSON(
            original,
            `pai_personal_storage_${original.spn}.json`,
            'pai_personal_storage.schema.json'
        );
        if (editResult) {
            this.allConfigurations[index] = editResult;
            await this.save();
        }
    }

    public async save(): Promise<void> {
        await this.context.globalState.update(PersonalStorageManager.CONF_KEY, this.configuration!);
        await (await getSingleton(StorageTreeDataProvider)).refresh();
    }

    public async delete(index: number): Promise<void> {
        this.allConfigurations.splice(index, 1);
        await this.save();
    }
}
