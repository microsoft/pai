/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */

import { injectable } from 'inversify';
import { commands, window } from 'vscode';

import {
    COMMAND_ADD_PERSONAL_STORAGE, COMMAND_DELETE_PERSONAL_STORAGE, COMMAND_EDIT_PERSONAL_STORAGE} from '../../common/constants';
import { __ } from '../../common/i18n';
import { getSingleton, Singleton } from '../../common/singleton';
import { Util } from '../../common/util';
import { PersonalAzureBlobRootItem } from '../container/storage/azureBlobTreeItem';
import { StorageTreeDataProvider } from '../container/storage/storageTreeView';

export interface IPersonalStorage {
    name: string;
    accountName: string;
    containerName: string;
    key: string;
}

export interface IStorageConfiguration {
    readonly version: string;
    storages: IPersonalStorage[];
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

    public get allConfigurations(): IPersonalStorage[] {
        return this.configuration!.storages;
    }

    public async onActivate(): Promise<void> {
        this.context.subscriptions.push(
            commands.registerCommand(COMMAND_ADD_PERSONAL_STORAGE, async () => this.add()),
            commands.registerCommand(
                COMMAND_EDIT_PERSONAL_STORAGE,
                async (node: PersonalAzureBlobRootItem) => {
                    await this.edit(node.index);
                }),
            commands.registerCommand(
                COMMAND_DELETE_PERSONAL_STORAGE,
                async (node: PersonalAzureBlobRootItem) => {
                    await this.delete(node.index);
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
        const validateResult: string | undefined = await Util.validateJSON(this.configuration!, 'pai_personal_storage.schema.json');
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

        const config: IPersonalStorage = {
            name: name,
            accountName: '',
            containerName: '',
            key: ''
        };

        await this.edit(this.allConfigurations.length, config);
    }

    public async edit(index: number, config?: IPersonalStorage): Promise<void> {
        const original: IPersonalStorage = this.allConfigurations[index] || config;
        const editResult: IPersonalStorage | undefined = await Util.editJSON(
            original,
            `pai_personal_storage_${original.name}.json`,
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