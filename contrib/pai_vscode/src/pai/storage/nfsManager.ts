/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */

import { injectable } from 'inversify';
import { IStorageServer } from 'openpai-js-sdk';
import { commands, env } from 'vscode';

import {
    COMMAND_OPEN_NFS
} from '../../common/constants';
import { __ } from '../../common/i18n';
import { Singleton } from '../../common/singleton';

/**
 * NFS management module
 */
@injectable()
export class NFSManager extends Singleton {
    constructor() {
        super();
        this.context.subscriptions.push(
            commands.registerCommand(
                COMMAND_OPEN_NFS,
                async (storage: IStorageServer) => {
                    await env.clipboard.writeText(`nfs://${storage.data.address}${storage.data.rootPath}`);
                }
            )
        );
    }
}