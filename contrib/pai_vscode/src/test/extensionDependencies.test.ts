/**
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *  @author Microsoft
 */
// tslint:disable:align
import * as assert from 'assert';
import * as vscode from 'vscode';

import { YAML_EXTENSION_ID } from '../common/constants';

suite('PAI Extension Dependencies', () => {
    test('Dependencies Validation', async () => {
        const ext: any = vscode.extensions.getExtension(YAML_EXTENSION_ID);

        if (!ext) {
            assert.fail('Please install \'YAML Support by Red Hat\' via the Extensions pane.');
        }
        const yamlPlugin: any = await ext.activate();
        if (!yamlPlugin || !yamlPlugin.registerContributor) {
            assert.fail('Please upgrade \'YAML Support by Red Hat\' via the Extensions pane.');
        }

        console.log('Active extension success.');
    });
});