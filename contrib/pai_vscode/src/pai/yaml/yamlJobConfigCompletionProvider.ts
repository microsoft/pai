/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */

import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';
import {
    Command,
    CompletionItem,
    CompletionItemKind,
    CompletionItemProvider,
    Position,
    SnippetString,
    TextDocument
} from 'vscode';

import { COMMAND_JOB_CONFIG_INSERT_RUNTIME_PLUGIN } from '../../common/constants';
import { __ } from '../../common/i18n';

export interface IYamlJobConfigSnippet {
    readonly name: string;
    readonly label: string;
    readonly documentation: string;
    readonly insertText: string;
}

/**
 * An OpenPAI completion provider provides yaml code snippets for job config.
 */
export class YamlJobConfigSnippets implements CompletionItemProvider {
    private snippets: IYamlJobConfigSnippet[] = [];

    public constructor() {
        this.loadSnippets();
    }

    public provideCompletionItems(document: TextDocument): CompletionItem[] | undefined {
        const command: Command = {
            command: COMMAND_JOB_CONFIG_INSERT_RUNTIME_PLUGIN,
            arguments: [document, undefined, true],
            title: __('job.runtime.plugin.insert')
        };

        return this.snippets.map(x => {
            const item: CompletionItem = new CompletionItem(x.label, CompletionItemKind.Snippet);
            item.insertText = new SnippetString(x.insertText.trimRight());
            item.documentation = x.documentation;
            if (x.name === 'openPaiRunetimePlugin') {
                item.command = command;
            }
            return item;
        });
    }

    private loadSnippets(): void {
        const root: string = path.join(__dirname, '../../../snippets');
        this.snippets = fs
            .readdirSync(root)
            .filter(x => x.endsWith('.yaml'))
            .map(f => yaml.safeLoad(fs.readFileSync(path.join(root, f), 'utf-8')));
    }
}

/**
 * An OpenPAI completion provider provides pai runtime plugin completion for job config.
 */
export class YamlJobConfigRuntimePlugins implements CompletionItemProvider {
    public async provideCompletionItems(
        document: TextDocument, position: Position
    ): Promise<CompletionItem[] | undefined> {
        const linePrefix: string =
            document.lineAt(position).text.substr(0, position.character);
        if (!linePrefix.endsWith('- plugin:')) {
            return undefined;
        }

        const item: CompletionItem = new CompletionItem(__('job.runtime.plugin.insert'), CompletionItemKind.Operator);
        item.insertText = '';
        item.command = {
            command: COMMAND_JOB_CONFIG_INSERT_RUNTIME_PLUGIN,
            arguments: [document, position],
            title: __('job.runtime.plugin.insert')
        };
        return [item];
    }
}
