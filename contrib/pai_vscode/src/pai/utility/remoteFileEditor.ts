/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */

import { injectable } from 'inversify';
import * as path from 'path';
import { window, workspace, TextDocument, Uri } from 'vscode';

import { __ } from '../../common/i18n';
import { Singleton } from '../../common/singleton';
import { Util } from '../../common/util';
import { StorageTreeNode } from '../container/common/treeNode';

/**
 * Remote file editor
 */
@injectable()
export class RemoteFileEditor extends Singleton {
    public fileMap: { [key: string]: [TextDocument, StorageTreeNode] } = {};

    public async showEditor(item: StorageTreeNode): Promise<void> {
        const fileName: string = item.label!;

        try {
            const parsedPath: path.ParsedPath = path.posix.parse(fileName);
            const temporaryFilePath: string = await Util.createTemporaryFile(parsedPath.base);
            await item.download(Uri.file(temporaryFilePath));
            const document: TextDocument | undefined = <TextDocument | undefined>
                await workspace.openTextDocument(temporaryFilePath);
            if (document) {
                this.fileMap[temporaryFilePath] = [document, item];
                await window.showTextDocument(document);
            } else {
                Util.err('storage.download.error', 'Unable to open');
            }
        } catch (err) {
            Util.err('storage.download.error', [err]);
        }
    }

    public async onDidSaveTextDocument(doc: TextDocument): Promise<void> {
        const filePath: string | undefined =
            Object.keys(this.fileMap).find(fp => path.relative(doc.uri.fsPath, fp) === '');
        if (filePath) {
            const item: StorageTreeNode = this.fileMap[filePath][1];
            try {
                while (true) {
                    // Only error message won't be collapsed automatically by vscode.
                    const upload: string = __('common.upload');
                    const result: string | undefined = await window.showInformationMessage(
                        __('util.remote.editor.save.prompt'),
                        upload,
                        __('common.cancel')
                    );
                    if (result === upload) {
                        await doc.save();
                        await item.parent!.uploadFile([doc.uri]);
                    }
                    return;
                }
            } catch (err) {
                console.log(err);
            }
        }
    }
}