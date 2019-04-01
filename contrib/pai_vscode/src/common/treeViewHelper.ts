/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */

import { injectable } from 'inversify';
import { isNil } from 'lodash';
import { commands, workspace } from 'vscode';

import { COMMAND_TREEVIEW_DOUBLECLICK } from '../common/constants';
import { __ } from '../common/i18n';
import { Singleton } from '../common/singleton';

/**
 * Supports double click commands for tree view
 */
@injectable()
export class TreeViewHelper extends Singleton {

    private lastClick?: { command: string, time: number };
    private readonly doubleClickInterval: number = 300;

    constructor() {
        super();
        this.context.subscriptions.push(
            commands.registerCommand(COMMAND_TREEVIEW_DOUBLECLICK, (command: string, ...args: string[]) => {
                const mode: string | undefined = workspace.getConfiguration('workbench.list').get('openMode');
                if (mode === 'doubleClick') {
                    void commands.executeCommand(command, ...args);
                } else {
                    // Single Click
                    if (
                        !isNil(this.lastClick) &&
                        this.lastClick.command === command &&
                        Date.now() - this.lastClick.time < this.doubleClickInterval
                    ) {
                        this.lastClick = undefined;
                        void commands.executeCommand(command, ...args);
                    } else {
                        this.lastClick = { command, time: Date.now() };
                    }
                }
            })
        );
    }
}