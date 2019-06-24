/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */

import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';
import * as vscode from 'vscode';

interface IYamlJobConfigSnippet {
    readonly name: string;
    readonly label: string;
    readonly documentation: string;
    readonly insertText: string;
}

/**
 * An OpenPAI completion provider provides yaml code snippets for job config.
 */
export class YamlJobConfigCompletionProvider implements vscode.CompletionItemProvider {
    private snippets: IYamlJobConfigSnippet[] = [];

    public constructor() {
        this.loadSnippets();
    }

    public provideCompletionItems(): vscode.CompletionItem[] {
        return this.snippets.map(x => {
            const item: vscode.CompletionItem = new vscode.CompletionItem(x.label, vscode.CompletionItemKind.Snippet);
            item.insertText = new vscode.SnippetString(x.insertText);
            item.documentation = x.documentation;
            return item;
        });
    }

    private loadSnippets(): void {
        const root: string = path.join(__dirname, '../../snippets');
        this.snippets = fs
            .readdirSync(root)
            .filter(x => x.endsWith('.yaml'))
            .map(f => yaml.safeLoad(fs.readFileSync(path.join(root, f), 'utf-8')));
    }
}
