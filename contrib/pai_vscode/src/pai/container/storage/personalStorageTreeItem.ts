/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */

import { IStorageServer } from 'openpai-js-sdk';
import { TreeItemCollapsibleState, Uri } from 'vscode';

import {
    CONTEXT_STORAGE_PERSONAL_ITEM,
    CONTEXT_STORAGE_PERSONAL_ROOT,
    ICON_STORAGE
} from '../../../common/constants';
import { __ } from '../../../common/i18n';
import { getSingleton } from '../../../common/singleton';
import { Util } from '../../../common/util';
import { PersonalStorageManager } from '../../storage/personalStorageManager';
import { StorageTreeNode } from '../common/treeNode';

import { AzureBlobRootItem } from './azureBlobTreeItem';
import { SambaRootNode } from './sambaTreeItem';

/**
 * PAI personal storage tree node.
 */
export class PersonalStorageTreeNode extends StorageTreeNode {
    public readonly contextValue: string = CONTEXT_STORAGE_PERSONAL_ITEM;
    public storage: IStorageServer;
    public data: StorageTreeNode;
    public index: number;

    constructor(
        storage: IStorageServer,
        index: number,
        parent?: StorageTreeNode,
        collapsibleState: TreeItemCollapsibleState = TreeItemCollapsibleState.Collapsed
    ) {
        super(storage.spn, parent, collapsibleState);
        this.iconPath = Util.resolvePath(ICON_STORAGE);
        this.index = index;
        this.storage = storage;
        this.data = this.initializeData();
    }

    public async refresh(): Promise<void> {
        return this.data.refresh();
    }

    public async getChildren(): Promise<StorageTreeNode[]> {
        return this.data.getChildren();
    }

    public async loadMore(): Promise<void> {
        await this.data.loadMore();
    }

    public async uploadFile(files?: Uri[]): Promise<void> {
        await this.data.uploadFile(files);
    }

    public async uploadFolder(): Promise<void> {
        await this.data.uploadFolder();
    }

    public async createFolder(): Promise<void> {
        await this.data.createFolder();
    }

    public initializeData(): StorageTreeNode {
        switch (this.storage.type) {
            case 'azureblob':
                return new AzureBlobRootItem(this.storage, '', this);
            case 'azurefile':
                return new StorageTreeNode('Azure File');
            case 'nfs':
                return new StorageTreeNode('NFS');
            case 'samba':
                return new SambaRootNode(this.storage, '', this);
            default:
                return new StorageTreeNode('Unsupported storage');
        }
    }
}

/**
 * PAI personal storage root node.
 */
export class PersonalStorageRootNode extends StorageTreeNode {
    public readonly contextValue: string = CONTEXT_STORAGE_PERSONAL_ROOT;

    constructor() {
        super(__('treeview.storage.personal-root.label'), undefined, TreeItemCollapsibleState.Expanded);
    }

    public async refresh(): Promise<void> {
        const personalStorageManager: PersonalStorageManager = await getSingleton(PersonalStorageManager);
        const storages: IStorageServer[] = personalStorageManager.allConfigurations;

        this.children = storages.map((storage, index) => new PersonalStorageTreeNode(storage, index, this));
    }
}
