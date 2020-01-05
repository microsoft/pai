/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */

import * as fs from 'fs-extra';
import { IStorageServer } from 'openpai-js-sdk';
import * as path from 'path';
import { TreeItemCollapsibleState, Uri } from 'vscode';

import {
    COMMAND_STORAGE_OPEN_FILE,
    COMMAND_TREEVIEW_DOUBLECLICK,
    CONTEXT_STORAGE_FILE,
    CONTEXT_STORAGE_FOLDER,
    CONTEXT_STORAGE_NFS,
    ICON_FILE,
    ICON_FOLDER
} from '../../../common/constants';

import { __ } from '../../../common/i18n';
import { getSingleton } from '../../../common/singleton';
import { Util } from '../../../common/util';
import { NFSManager } from '../../storage/nfsManager';
import { RemoteFileEditor } from '../../utility/remoteFileEditor';
import { StorageTreeNode } from '../common/treeNode';

/**
 * PAI NFS storage tree node.
 */
export class NFSTreeNode extends StorageTreeNode {
    public rootPath: string;
    public name: string;
    public isFolder: boolean;

    constructor(name: string, rootPath: string, parent: StorageTreeNode) {
        const stat: fs.Stats = fs.statSync(rootPath);
        const isFolder: boolean = stat.isDirectory();
        super(name, parent, isFolder ?
            TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.None);
        this.isFolder = isFolder;
        this.contextValue = this.isFolder ? CONTEXT_STORAGE_FOLDER : CONTEXT_STORAGE_FILE;
        this.rootPath = rootPath;
        this.name = name;

        if (this.isFolder) {
            this.iconPath = Uri.file(Util.resolvePath(ICON_FOLDER));
        } else {
            this.iconPath = Uri.file(Util.resolvePath(ICON_FILE));
            this.command = {
                title: __('treeview.node.storage.openfile'),
                command: COMMAND_TREEVIEW_DOUBLECLICK,
                arguments: [COMMAND_STORAGE_OPEN_FILE, this]
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

    public async download(dest?: Uri): Promise<void> {
        await NFSManager.downloadFile(this, dest);
    }

    public async uploadFile(files?: Uri[]): Promise<void> {
        await NFSManager.uploadFiles(this, files);
    }

    public async delete(): Promise<void> {
        await NFSManager.delete(this);
    }

    public async openFile(): Promise<void> {
        const remoteFileEditor: RemoteFileEditor =
            await getSingleton(RemoteFileEditor);
        await remoteFileEditor.showEditor(this);
    }

    public async uploadFolder(): Promise<void> {
        await NFSManager.uploadFolders(this);
    }

    public async createFolder(): Promise<void> {
        await NFSManager.createFolder(this);
    }
}

/**
 * PAI NFS storage root node.
 */
export class NFSRootNode extends StorageTreeNode {
    public storageServer: IStorageServer;
    public mountPath: string;
    public rootPath: string;

    constructor(storage: IStorageServer, mountPath: string, parent: StorageTreeNode) {
        super(storage.spn, parent, TreeItemCollapsibleState.Collapsed);
        this.contextValue = CONTEXT_STORAGE_NFS;
        this.storageServer = storage;
        this.description = 'NFS';
        this.mountPath = mountPath;
        const rootUrl: string =
            `//${this.storageServer.data.address}${this.storageServer.data.rootPath}`;
        this.rootPath = path.join(rootUrl, this.mountPath);
    }

    public async refresh(): Promise<void> {
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

    public async uploadFile(files?: Uri[]): Promise<void> {
        await NFSManager.uploadFiles(this, files);
    }

    public async uploadFolder(): Promise<void> {
        await NFSManager.uploadFolders(this);
    }

    public async createFolder(): Promise<void> {
        await NFSManager.createFolder(this);
    }
}