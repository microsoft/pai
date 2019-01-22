/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */

import { injectable } from 'inversify';
import * as querystring from 'querystring';
import * as vscode from 'vscode';

import { ICON_PAI } from './constants';
import { getSingleton, Singleton } from './singleton';
import { Util } from './util';

function generateHtml(url: string): string {
    return `<body style='padding: 0'>
        <iframe id='vscodeai-frame' frameborder=0 style='position: absolute; width: 100%; height: 100%'>
        </iframe>
        <script>
            document.getElementById('vscodeai-frame').src="${url}";
        </script>
    </body>`;
}

/**
 * DCP
 */
@injectable()
export class DocumentContentProvider extends Singleton implements vscode.TextDocumentContentProvider {
    public scheme: string = 'paiext';

    constructor() {
        super();
        this.context.subscriptions.push(
            vscode.workspace.registerTextDocumentContentProvider(this.scheme, this)
        );
    }

    public provideTextDocumentContent(uri: vscode.Uri): string {
        const query: string = uri.query;
        const target: string = <string>querystring.parse(query).url;

        return generateHtml(target);
    }
}

export async function previewHtml(url: string, title: string): Promise<void> {
    url = Util.fixURL(url);
    // vscode will decode the querystring when parse the url
    // https://github.com/Microsoft/vscode/issues/53824
    // https://github.com/Microsoft/vscode/issues/32026
    void vscode.commands.executeCommand(
        'vscode.previewHtml',
        `${(await getSingleton(DocumentContentProvider)).scheme}://authority/redirect?${encodeURIComponent(querystring.stringify({
            url: url
        }))}`,
        vscode.ViewColumn.Active,
        title
    );
}

export async function openInWebView(url: string, title: string): Promise<void> {
    url = Util.fixURL(url);
    const panel: vscode.WebviewPanel = vscode.window.createWebviewPanel(
        (await getSingleton(DocumentContentProvider)).scheme,
        title,
        vscode.ViewColumn.Active,
        { enableScripts: true }
    );
    panel.iconPath = vscode.Uri.file(Util.resolvePath(ICON_PAI.dark));
    panel.webview.html = generateHtml(url);
}
