/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */

import * as child from 'child_process';
import { Dictionary } from 'lodash';
import { IStorageServer } from 'openpai-js-sdk';
import * as os from 'os';
import {
    commands, window, workspace, Terminal, WorkspaceConfiguration
} from 'vscode';

import {
    COMMAND_STORAGE_NFS_MOUNT, COMMAND_STORAGE_NFS_MOUNT_POINT, SETTING_SECTION_STORAGE_NFS, SETTING_STORAGE_NFS_MOUNT_POINT
} from '../../common/constants';
import { __ } from '../../common/i18n';
import { getSingleton, Singleton } from '../../common/singleton';
import { Util } from '../../common/util';
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
                async (node: StorageTreeNode, key: string) =>
                    await this.setupMountPoint(node, key)
            ),
            commands.registerCommand(
                COMMAND_STORAGE_NFS_MOUNT,
                async (node: NfsRootNode, mountPath: string) =>
                    await this.mountNfs(node, mountPath)
            )
        );
    }

    public async setupMountPoint(node: StorageTreeNode, key: string): Promise<void> {
        const settings: WorkspaceConfiguration =
            workspace.getConfiguration(SETTING_SECTION_STORAGE_NFS);
        const mountPath: string | undefined = await window.showInputBox({
            prompt: __('storage.nfs.mount.point.prompt'),
            validateInput: (val: string): string => {
                if (!val) {
                    return __('container.nfs.mount.path.empty');
                }
                switch (os.platform()) {
                    case 'win32':
                        if (!/[a-zA-Z]:/.test(val)) {
                            Util.err('container.nfs.mount.invalid.device.name');
                        }
                        break;
                    default:
                }
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
    }

    public async mountNfs(node: NfsRootNode, mountPath: string): Promise<void> {
        const server: IStorageServer = node.storageServer;
        let cmdStr: string = '';
        switch (os.platform()) {
            case 'win32':
                cmdStr = `cmd /c "mount -o anon ${server.data.address}:${server.data.rootPath} ${mountPath}"`;
                break;
            case 'darwin':
                cmdStr = `sudo mkdir -p ${mountPath} && ` +
                    `sudo mount -t nfs -o resvport,hard,nolock ${server.data.address}:${server.data.rootPath} ${mountPath}`;
                break;
            default:
                Util.err('container.nfs.mount.unsupport.os');
                return;
        }
        const provider: StorageTreeDataProvider = await getSingleton(StorageTreeDataProvider);

        if (os.platform() === 'win32') {
            child.exec(cmdStr, (err, stdout, stderr) => {
                if (err) {
                    Util.err('container.nfs.mount.failed', err);
                }
                if (stdout) {
                    Util.info(stdout);
                }
                if (stderr) {
                    Util.warn(stderr);
                }
                void provider.refresh(node.parent);
            });
        } else {
            const terminal: Terminal = window.createTerminal('PAI Mount NFS');
            terminal.show();
            terminal.sendText(cmdStr);
            const FINISH: string = __('common.finish');
            const CANCEL: string = __('common.cancel');

            const result: string | undefined = await window.showWarningMessage(
                __('util.editjson.prompt'),
                FINISH,
                CANCEL
            );

            if (result === FINISH) {
                await provider.refresh(node.parent);
            }
        }
    }
}
