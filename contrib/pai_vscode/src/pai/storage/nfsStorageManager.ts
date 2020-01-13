/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */

import { Dictionary } from 'lodash';
import { IStorageServer } from 'openpai-js-sdk';
import {
    commands, window, workspace, Terminal, WorkspaceConfiguration
} from 'vscode';

import {
    COMMAND_STORAGE_NFS_MOUNT, COMMAND_STORAGE_NFS_MOUNT_POINT, SETTING_SECTION_STORAGE_NFS, SETTING_STORAGE_NFS_MOUNT_POINT
} from '../../common/constants';
import { __ } from '../../common/i18n';
import { getSingleton, Singleton } from '../../common/singleton';
import { StorageTreeNode } from '../container/common/treeNode';
import { NfsRootNode } from '../container/storage/NfsTreeItem';
import { StorageTreeDataProvider } from '../container/storage/storageTreeView';

/**
 * Nfs storage management module.
 */
export class NfsStorageManager extends Singleton {
    public async onActivate(): Promise<void> {
        this.context.subscriptions.push(
            commands.registerCommand(
                COMMAND_STORAGE_NFS_MOUNT_POINT,
                async (node: StorageTreeNode, key: string) => {
                    const settings: WorkspaceConfiguration =
                        workspace.getConfiguration(SETTING_SECTION_STORAGE_NFS);
                    const mountPath: string | undefined = await window.showInputBox({
                        prompt: __('storage.nfs.mount.point.prompt'),
                        validateInput: (): string => {
                            // todo: add validation
                            return '';
                        }
                    });
                    if (mountPath) {
                        try {
                            let map: Dictionary<string> | undefined =
                                await settings.get(SETTING_STORAGE_NFS_MOUNT_POINT);
                            if (!map) {
                                map = {};
                            }
                            map[key] = mountPath;
                            await settings.update(SETTING_STORAGE_NFS_MOUNT_POINT, map);
                        } catch (ex) {
                            console.log(ex);
                        }
                        await (await getSingleton(StorageTreeDataProvider)).refresh(node.parent);
                    }
                }),
            commands.registerCommand(
                COMMAND_STORAGE_NFS_MOUNT,
                async (node: NfsRootNode) => {
                    const server: IStorageServer = node.storageServer;
                    const mountPath: string = node.rootPath!;

                    const terminal: Terminal = window.createTerminal('PAI mount NFS');
                    terminal.sendText(`cmd /c "mount -o anon ${server.data.address}:${server.data.rootPath} ${mountPath}"`);
                })
        );
    }
}
