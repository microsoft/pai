/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */

import { IStorageServer } from 'openpai-js-sdk';
import { TreeItemCollapsibleState } from 'vscode';

import {
    CONTEXT_STORAGE_PERSONAL_ITEM,
    CONTEXT_STORAGE_PERSONAL_ROOT,
    ICON_STORAGE
} from '../../../common/constants';
import { __ } from '../../../common/i18n';
import { getSingleton } from '../../../common/singleton';
import { Util } from '../../../common/util';
import { StorageTreeNode } from '../common/treeNode';

import { PersonalStorageManager } from '../../storage/personalStorageManager';

/**
 * PAI personal storage tree node.
 */
export class PersonalStorageTreeNode extends StorageTreeNode {
    public readonly contextValue: string = CONTEXT_STORAGE_PERSONAL_ITEM;
    public storage: IStorageServer;

    constructor(
        storage: IStorageServer,
        parent?: StorageTreeNode,
        collapsibleState: TreeItemCollapsibleState = TreeItemCollapsibleState.Collapsed
    ) {
        super(storage.spn, parent, collapsibleState);
        this.iconPath = Util.resolvePath(ICON_STORAGE);
        this.storage = storage;
    }

    public async refresh(): Promise<void> {
        try {
            // todo: sth.
        } catch (e) {
            Util.err('treeview.storage.error', [e.message || e]);
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

        this.children = storages.map(storage => new PersonalStorageTreeNode(storage, this));
    }
}
