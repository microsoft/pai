/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */

import { injectable } from 'inversify';
import * as vscode from 'vscode';

import {
    COMMAND_OPEN_NFS
} from '../../common/constants';
import { __ } from '../../common/i18n';
import { Singleton } from '../../common/singleton';

/**
 * HDFS management module
 */
@injectable()
export class NFS extends Singleton {
    constructor() {
        super();
        this.context.subscriptions.push(
            vscode.commands.registerCommand(
                COMMAND_OPEN_NFS,
                async () => {
                    return undefined;
                }
            )
        );
    }
}