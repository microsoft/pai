/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */

import * as fs from 'fs';
import { IStorageServer } from 'openpai-js-sdk';
import * as path from 'path';
import { TreeItemCollapsibleState, Uri } from 'vscode';

import {
    COMMAND_OPEN_NFS,
    COMMAND_TREEVIEW_DOUBLECLICK,
    CONTEXT_STORAGE_FILE,
    CONTEXT_STORAGE_FOLDER,
    CONTEXT_STORAGE_NFS,
    ICON_FILE,
    ICON_FOLDER
} from '../../../common/constants';

import { __ } from '../../../common/i18n';
import { Util } from '../../../common/util';
import { StorageTreeNode } from '../common/treeNode';

/**
 * PAI NFS storage tree node.
 */
export class NFSTreeNode extends StorageTreeNode {
    public rootPath: string;
    public isFolder: boolean;

    constructor(name: string, rootPath: string, parent: StorageTreeNode) {
        super(name, parent, TreeItemCollapsibleState.Collapsed);
        const stat: fs.Stats = fs.statSync(rootPath);
        this.isFolder = stat.isDirectory();
        this.contextValue = this.isFolder ? CONTEXT_STORAGE_FOLDER : CONTEXT_STORAGE_FILE;
        this.rootPath = rootPath;

        if (this.isFolder) {
            this.iconPath = Uri.file(Util.resolvePath(ICON_FOLDER));
        } else {
            this.iconPath = Uri.file(Util.resolvePath(ICON_FILE));
            this.command = {
                title: __('treeview.node.storage.openfile'),
                command: COMMAND_TREEVIEW_DOUBLECLICK,
                arguments: [COMMAND_OPEN_NFS, this]
            };
        }
    }

    public async refresh(): Promise<void> {
        if (!this.isFolder) {
            return;
        }

        try {
            const list: string[] = fs.readdirSync(this.rootPath);
            this.children = list.map(name =>
                new NFSTreeNode(name, path.join(this.rootPath, name), this));
        } catch (err) {
            const child: StorageTreeNode =
                new StorageTreeNode(__('treeview.node.storage.load-error'), this.parent);
            child.description = err.message;
            this.children.push(child);
        }
    }
}

/**
 * PAI NFS storage root node.
 */
export class NFSRootNode extends StorageTreeNode {
    public storageServer: IStorageServer;
    public rootPath: string;

    constructor(storage: IStorageServer, rootPath: string, parent: StorageTreeNode) {
        super(storage.spn, parent, TreeItemCollapsibleState.Collapsed);
        this.contextValue = CONTEXT_STORAGE_NFS;
        this.storageServer = storage;
        this.description = 'NFS';
        this.rootPath = rootPath;
    }

    public async refresh(): Promise<void> {
        try {
            const rootUrl: string = `//${this.storageServer.data.address}${this.storageServer.data.rootPath}`;
            const url: string = path.join(rootUrl, this.rootPath);
            const list: string[] = fs.readdirSync(url);
            this.children = list.map(name => new NFSTreeNode(name, path.join(url, name), this));
        } catch (err) {
            const child: StorageTreeNode =
                new StorageTreeNode(__('treeview.node.storage.load-error'), this.parent);
            child.description = err.message;
            this.children.push(child);
        }
    }
}