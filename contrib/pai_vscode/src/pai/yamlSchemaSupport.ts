/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */

import * as fs from 'fs-extra';
import * as _ from 'lodash';
import * as vscode from 'vscode';

import { parse, util, YamlDocument, YamlNode } from 'node-yaml-parser';

import {
    OPENPAI_SCHEMA,
    OPENPAI_YAML_SCHEMA_PREFIX,
    SCHEMA_YAML_JOB_CONFIG,
    SCHEMA_YAML_JOB_CONFIG_PATH,
    YAML_EXTENSION_ID
} from '../common/constants';

/**
 * The yaml schema holder.
 */
class OpenPaiYamlSchemaHolder {
    private _schema: string | undefined;

    public async loadSchema(schemaPath: string): Promise<void> {
        this._schema = await fs.readFile(schemaPath, 'utf8');
    }

    public schema(): string {
        return this._schema!;
    }
}

const openPaiYamlSchemaHolder: OpenPaiYamlSchemaHolder = new OpenPaiYamlSchemaHolder();

export async function registerYamlSchemaSupport(): Promise<void> {
    await openPaiYamlSchemaHolder.loadSchema(SCHEMA_YAML_JOB_CONFIG_PATH);
    const yamlPlugin: any = await activateYamlExtension();
    if (!yamlPlugin || !yamlPlugin.registerContributor) {
        // activateYamlExtension has already alerted to users for errors.
        return;
    }

    // register for openpai yaml schema provider
    yamlPlugin.registerContributor(OPENPAI_SCHEMA, requestYamlSchemaUriCallback,  requestYamlSchemaContentCallback);
}

async function activateYamlExtension(): Promise<any | undefined> {
    const ext: any = vscode.extensions.getExtension(YAML_EXTENSION_ID);

    if (!ext) {
        await vscode.window.showWarningMessage('Please install \'YAML Support by Red Hat\' via the Extensions pane.');
        return undefined;
    }
    const yamlPlugin: any = await ext.activate();

    if (!yamlPlugin || !yamlPlugin.registerContributor) {
        await vscode.window.showWarningMessage('Please upgrade \'YAML Support by Red Hat\' via the Extensions pane.');
        return undefined;
    }

    return yamlPlugin;
}

function requestYamlSchemaUriCallback(resource: string): string | undefined {
    const textEditor: vscode.TextEditor | undefined =
        vscode.window.visibleTextEditors.find((editor) => editor.document.uri.toString() === resource);
    const paiYamlJobConfigSchemaUri: string = OPENPAI_YAML_SCHEMA_PREFIX + SCHEMA_YAML_JOB_CONFIG;

    if (textEditor) {
        if (textEditor.document.uri.toString().toLowerCase().endsWith('.pai.yaml')) {
            // If the yaml file name match '*.pai.yaml', it will report it is a pai job conifg file.
            return paiYamlJobConfigSchemaUri;
        }

        const docs: YamlDocument[] = parse(textEditor.document.getText()).documents;
        for (const [, x] of docs.entries()) {
            const top: YamlNode | undefined = x.nodes.find(util.isMapping);
            if (top) {
                // If the yaml document contains 'protocolVersion: 2', it will report it is a pai job conifg file.
                const item: any = top.mappings.find(
                    (mapping: { key: { raw: string; }; }) => mapping.key &&
                    _.isString(mapping.key.raw) &&
                    mapping.key.raw.toLowerCase() === 'protocolversion');

                if (item && (item.value.raw === '2' || item.value.raw === 2)) {
                    return paiYamlJobConfigSchemaUri;
                }
            }
        }
        return undefined;
    }
    return undefined;
}

function requestYamlSchemaContentCallback(uri: string): string | undefined {
    const parsedUri: vscode.Uri = vscode.Uri.parse(uri);
    if (parsedUri.scheme !== OPENPAI_SCHEMA) {
        return undefined;
    }
    if (!parsedUri.path || !parsedUri.path.startsWith('/')) {
        return undefined;
    }

    return openPaiYamlSchemaHolder.schema();
}
