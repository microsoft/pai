/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import {
    window, StatusBarAlignment, StatusBarItem, Uri
} from 'vscode';

import {
    OCTICON_CLOUDDOWNLOAD, OCTICON_CLOUDUPLOAD
} from '../../common/constants';
import { __ } from '../../common/i18n';
import { Util } from '../../common/util';
import { MountPointTreeNode } from '../container/storage/mountPointTreeItem';
import { SambaRootNode, SambaTreeNode } from '../container/storage/sambaTreeItem';

/**
 * Samba management module
 */
// tslint:disable-next-line: no-unnecessary-class
export class SambaManager {
    public static async delete(target: SambaTreeNode): Promise<void> {
        try {
            await fs.remove(target.rootPath);
            Util.info('storage.delete.success');
        } catch (err) {
            Util.err('storage.delete.error', [err]);
        }
    }

    public static async downloadFile(target: SambaTreeNode, dest?: Uri): Promise<void> {
        const uri: Uri | undefined = dest ? dest : await window.showSaveDialog({
            saveLabel: __('storage.dialog.label.download'),
            defaultUri: Uri.file(target.name)
        });
        if (uri && uri.scheme === 'file') {
            const totalBytes: number = 1;

            const statusBarItem: StatusBarItem =
            window.createStatusBarItem(StatusBarAlignment.Right, Number.MAX_VALUE);
            statusBarItem.text =
                `${OCTICON_CLOUDUPLOAD} ${__('storage.download.status', [0, totalBytes])}`;
            statusBarItem.show();
            try {
                await fs.copy(target.rootPath, uri.fsPath);
                statusBarItem.text =
                    `${OCTICON_CLOUDDOWNLOAD} ${__('storage.download.status', [1, totalBytes])}`;
                Util.info('storage.download.success');
            } catch (err) {
                Util.err('storage.download.error', [err]);
            }
            statusBarItem.dispose();
        }
    }

    public static async createFolder(target: SambaTreeNode | SambaRootNode | MountPointTreeNode): Promise<void> {
        const res: string | undefined = await window.showInputBox({
            prompt: __('container.azure.blob.mkdir.prompt')
        });
        if (res === undefined) {
            Util.warn('container.azure.blob.mkdir.cancelled');
            return;
        }
        if (target instanceof MountPointTreeNode) {
            target = <SambaRootNode>target.data;
        }

        try {
            const dirName: string = path.join(target.rootPath, res);
            await fs.mkdirp(dirName);
            Util.info('storage.create.folder.success');
        } catch (err) {
            Util.err('storage.create.folder.error', [err]);
        }
    }

    public static async uploadFiles(
        target: SambaTreeNode | SambaRootNode | MountPointTreeNode,
        files?: Uri[]
    ): Promise<void> {
        if (!files) {
            files = await window.showOpenDialog({
                canSelectFiles: true,
                canSelectMany: true,
                openLabel: __('storage.dialog.label.upload-files')
            });
        }
        if (!files) {
            return;
        }

        if (target instanceof MountPointTreeNode) {
            target = <SambaRootNode>target.data;
        }
        const statusBarItem: StatusBarItem =
            window.createStatusBarItem(StatusBarAlignment.Right, Number.MAX_VALUE);
        statusBarItem.text =
            `${OCTICON_CLOUDUPLOAD} ${__('storage.upload.status', [0, files.length])}`;
        statusBarItem.show();
        try {
            for (const [i, file] of files.entries()) {
                const name: string = path.basename(file.fsPath);
                const targetPath: string = path.join((<any>target).rootPath, name);
                statusBarItem.text =
                    `${OCTICON_CLOUDUPLOAD} ${__('storage.upload.status', [i, files.length])}`;
                await fs.copy(file.fsPath, targetPath);
            }
            Util.info('storage.upload.success');
        } catch (err) {
            Util.err('storage.upload.error', [err]);
        }
        statusBarItem.dispose();
    }

    public static async uploadFolders(
        target: SambaTreeNode | SambaRootNode | MountPointTreeNode,
        src?: Uri[]
    ): Promise<void> {
        const folders: Uri[] | undefined = src ? src : await window.showOpenDialog({
            canSelectFolders: true,
            canSelectMany: true,
            openLabel: __('storage.dialog.label.upload-folders')
        });
        if (!folders) {
            return;
        }

        if (target instanceof MountPointTreeNode) {
            target = <SambaRootNode>target.data;
        }
        const statusBarItem: StatusBarItem =
            window.createStatusBarItem(StatusBarAlignment.Right, Number.MAX_VALUE);
        statusBarItem.text =
            `${OCTICON_CLOUDUPLOAD} ${__('storage.upload.status', [0, folders.length])}`;
        statusBarItem.show();
        try {
            for (const [i, folder] of folders.entries()) {
                const name: string = path.basename(folder.fsPath);
                const targetPath: string = path.join((<any>target).rootPath, name);
                statusBarItem.text =
                    `${OCTICON_CLOUDUPLOAD} ${__('storage.upload.status', [i, folders.length])}`;
                await fs.copy(folder.fsPath, targetPath);
            }
            Util.info('storage.upload.success');
        } catch (err) {
            Util.err('storage.upload.error', [err]);
        }
        statusBarItem.dispose();
    }
}
