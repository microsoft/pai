
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */

import * as fs from 'fs-extra';
import { Dictionary } from 'lodash';
import { IStorageServer } from 'openpai-js-sdk';
import * as os from 'os';
import * as path from 'path';
import { workspace, Uri, WorkspaceConfiguration } from 'vscode';

import {
    COMMAND_STORAGE_NFS_MOUNT,
    COMMAND_STORAGE_NFS_MOUNT_POINT,
    COMMAND_TREEVIEW_DOUBLECLICK,
    CONTEXT_STORAGE_MOUNTPOINT_ITEM,
    CONTEXT_STORAGE_NFS,
    SETTING_SECTION_STORAGE_NFS,
    SETTING_STORAGE_NFS_MOUNT_POINT
} from '../../../common/constants';
import { __ } from '../../../common/i18n';
import { PathBaseStorageManager } from '../../storage/pathBaseStorageManager';
import { StorageTreeNode } from '../common/treeNode';

import { MountPointTreeNode } from './mountPointTreeItem';
import { PathBaseTreeNode } from './pathBaseTreeItem';

/**
 * PAI NFS storage root node.
 */
export class NfsRootNode extends StorageTreeNode {
    public storageServer: IStorageServer;
    public mountPath: string;
    public setupMountPoint: boolean = false;
    public rootPath?: string;

    constructor(storage: IStorageServer, mountPath: string, parent: StorageTreeNode) {
        super(storage.spn, parent);
        this.contextValue = CONTEXT_STORAGE_NFS;
        this.storageServer = storage;
        this.description = 'NFS';
        this.mountPath = mountPath;
        this.loadRootPath();
    }

    public loadRootPath(): void {
        const settings: WorkspaceConfiguration =
            workspace.getConfiguration(SETTING_SECTION_STORAGE_NFS);
        const clusterName: string = (<MountPointTreeNode>this.parent).contextValue === CONTEXT_STORAGE_MOUNTPOINT_ITEM ?
                (<MountPointTreeNode>this.parent).cluster.name! : 'personal_storage';
        const storageName: string = this.storageServer.spn;
        const key: string = `${clusterName}_${storageName}`;
        const map: Dictionary<string> | undefined =
            settings.get(SETTING_STORAGE_NFS_MOUNT_POINT);
        if (map !== null && map![key]) {
            this.rootPath = this.resolveHome(path.join(map![key], '/', this.mountPath));
            this.setupMountPoint = true;
        }
    }

    public resolveHome(filepath: string): string {
        if (filepath[0] === '~') {
            return path.join(os.homedir(), filepath.slice(1));
        }
        return filepath;
    }

    public async refresh(): Promise<void> {
        this.loadRootPath();
        if (this.setupMountPoint) {
            try {
                const list: string[] = fs.readdirSync(this.rootPath!);
                this.children = list.map(name =>
                    new PathBaseTreeNode(name, path.join(this.rootPath!, name), this));
            } catch (err) {
                const setupNfsMountPoint: StorageTreeNode =
                    new StorageTreeNode(__('treeview.storage.nfs.mount'), this.parent);
                const clusterName: string = (<MountPointTreeNode>this.parent).contextValue === CONTEXT_STORAGE_MOUNTPOINT_ITEM ?
                    (<MountPointTreeNode>this.parent).cluster.name! : 'personal_storage';
                const storageName: string = this.storageServer.spn;
                const key: string = `${clusterName}_${storageName}`;
                const settings: WorkspaceConfiguration =
                    workspace.getConfiguration(SETTING_SECTION_STORAGE_NFS);
                const map: Dictionary<string> | undefined =
                    settings.get(SETTING_STORAGE_NFS_MOUNT_POINT);
                setupNfsMountPoint.command = {
                    title: __('pai.storage.nfs.mountPoint'),
                    command: COMMAND_TREEVIEW_DOUBLECLICK,
                    arguments: [COMMAND_STORAGE_NFS_MOUNT, this, map![key]]
                };
                this.children = [
                    setupNfsMountPoint
                ];
            }
        } else {
            const setupNfsMountPoint: StorageTreeNode =
                new StorageTreeNode(__('treeview.storage.nfs.setup.mount.point'), this.parent);
            const clusterName: string = (<MountPointTreeNode>this.parent).contextValue === CONTEXT_STORAGE_MOUNTPOINT_ITEM ?
                (<MountPointTreeNode>this.parent).cluster.name! : 'personal_storage';
            const storageName: string = this.storageServer.spn;
            const key: string = `${clusterName}_${storageName}`;
            setupNfsMountPoint.command = {
                title: __('pai.storage.nfs.mountPoint'),
                command: COMMAND_TREEVIEW_DOUBLECLICK,
                arguments: [COMMAND_STORAGE_NFS_MOUNT_POINT, this, key]
            };
            this.children = [
                setupNfsMountPoint
            ];
        }
    }

    public async uploadFile(files?: Uri[]): Promise<void> {
        if (this.setupMountPoint) {
            await PathBaseStorageManager.uploadFiles(this, files);
        }
    }

    public async uploadFolder(): Promise<void> {
        if (this.setupMountPoint) {
            await PathBaseStorageManager.uploadFolders(this);
        }
    }

    public async createFolder(folder?: string): Promise<void> {
        if (this.setupMountPoint) {
            await PathBaseStorageManager.createFolder(this, folder);
        }
    }
}
