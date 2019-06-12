/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */

import * as vscode from 'vscode';

import * as Singleton from './common/singleton';
import { allSingletonClasses } from './root';

export async function activate(context: vscode.ExtensionContext): Promise<void> {
    Singleton.bindExtensionContext(context);
    await Singleton.initializeAll(allSingletonClasses);
}

export async function deactivate(): Promise<void> {
    await Singleton.dispose();
}