/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */

import * as Ajv from 'ajv';
import * as fs from 'fs-extra';
import { injectable } from 'inversify';
import { SchemaMetadataWriter } from 'json-inline-doc';
import { dereference, JSONSchema } from 'json-schema-ref-parser';
import { parse, visit } from 'jsonc-parser';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';

import { __, I18nFormatFunction } from './i18n';
import { Singleton } from './singleton';

import unixify = require('unixify'); // tslint:disable-line
import opn = require('opn'); // tslint:disable-line

export let Util: UtilClass;

/**
 * Utility class
 */
@injectable()
export class UtilClass extends Singleton {
    private static readonly TMP_DIR_PREFIX: string = 'paiext_';
    private static readonly SCHEMAS_DIR: string = './schemas/';

    private readonly FINISH: string = __('common.finish');
    private readonly CANCEL: string = __('common.cancel');

    private readonly ajv: Ajv.Ajv = new Ajv({
        loadSchema: this.loadSchema.bind(this)
    });

    private readonly schemaPromises: Map<string, PromiseLike<Ajv.ValidateFunction>> = new Map();
    private readonly tempDirectories: Set<string> = new Set();
    private lastJSONEditorPath: string | undefined;

    constructor() {
        super();
        Util = this;
    }

    public tuple<T1, T2, T3, T4, T5>(data: [T1, T2, T3, T4, T5]) : typeof data;
    public tuple<T1, T2, T3, T4>(data: [T1, T2, T3, T4]) : typeof data;
    public tuple<T1, T2, T3>(data: [T1, T2, T3]) : typeof data;
    public tuple<T1, T2>(data: [T1, T2]) : typeof data;
    // Forcing array literal as tuple type
    public tuple<T>(data: T[]): T[] {
        return data;
    }

    public resolvePath(filePath: string): string;
    public resolvePath(filePath: { light: string, dark: string }): { light: string, dark: string };
    public resolvePath(filePath: string | { light: string, dark: string }): string | { light: string, dark: string };
    public resolvePath(filePath: string | { light: string, dark: string }): string | { light: string, dark: string } {
        if (typeof filePath === 'string') {
            if (!path.isAbsolute(filePath)) {
                return path.join(this.context!.extensionPath, filePath);
            }
            return filePath;
        } else {
            return {
                light: this.resolvePath(filePath.light),
                dark: this.resolvePath(filePath.dark)
            };
        }
    }

    public uriPathAppend(base: vscode.Uri, suffix: string): vscode.Uri {
        const lastChar: string = base.path[base.path.length - 1];
        if (lastChar !== '/' && lastChar !== '\\') {
            suffix = '/' + suffix;
        }
        return vscode.Uri.parse(base.toString() + unixify(suffix));
    }

    public uriPathPop(base: vscode.Uri): vscode.Uri {
        const newPath: string = path.dirname(base.path);
        const originalStr: string = base.toString();

        return vscode.Uri.parse(originalStr.substr(0, originalStr.length - base.path.length + newPath.length));
    }

    public info: I18nFormatFunction = function (this: UtilClass, ...args: any): string {
        const result: string = __.apply(this, args);
        void vscode.window.showInformationMessage(result);
        return result;
    };

    public warn: I18nFormatFunction = function (this: UtilClass, ...args: any): string {
        const result: string = __.apply(this, args);
        void vscode.window.showWarningMessage(result);
        return result;
    };

    // Call this function with the same argument as you do with __ function to show an error message
    public err: I18nFormatFunction = function (this: UtilClass, ...args: any): string {
        const result: string = __.apply(this, args);
        void vscode.window.showErrorMessage(result);
        return result;
    };

    public async getNewTempDirectory(): Promise<string> {
        const p: string = await fs.mkdtemp(path.join(os.tmpdir(), UtilClass.TMP_DIR_PREFIX));
        this.tempDirectories.add(p);
        return p;
    }

    public async cleanTempDirectory(tempPath: string): Promise<void> {
        this.tempDirectories.delete(tempPath);
        try {
            // Remove the temp directory and remaining file
            await fs.remove(tempPath);
        } catch { }
    }

    public async generateCommentedJSON(obj: any, schemaFile: string): Promise<string | undefined> {
        const schema: JSONSchema = await dereference(this.schemaPath(schemaFile));
        const writer: SchemaMetadataWriter = new SchemaMetadataWriter(
            schema,
            s => s.description ? { type: 'line', content: s.description } : undefined
        );
        return writer.stringify(obj, null, 4);
    }

    public getPositionByOffset(content: string, offset: number): vscode.Position {
        let line: number = 0;
        let char: number = 0;
        for (let i: number = 0; i < offset; i++) {
            if (content[i] === '\n') {
                line++;
                char = 0;
            } else {
                char++;
            }
        }
        return new vscode.Position(line, char);
    }

    public getJsonValueSelection(content: string, keyToSelect: string): vscode.Selection | undefined {
        // Select value of keyToSelect in json object
        let keyEncountered: boolean = false;
        let selection: vscode.Selection | undefined;
        visit(content, {
            onObjectProperty(property: string, offset: number, length: number): void {
                if (property === keyToSelect) {
                    keyEncountered = true;
                }
            },
            onLiteralValue(value: any, offset: number, length: number): void {
                if (keyEncountered && content) {
                    keyEncountered = false;
                    const pos: vscode.Position = Util.getPositionByOffset(content, offset);
                    selection = new vscode.Selection(
                        pos.translate(0, 1),
                        pos.translate(0, length - 1)
                    );
                }
            }
        });
        return selection;
    }

    public async editJSON<T>(obj: T, fileName: string, schemaFile?: string, highlightKey?: string): Promise<T | undefined> {
        const tempPath: string = await this.getNewTempDirectory();
        let filePath: string = path.join(tempPath, fileName.replace(/\//g, ''));

        // If the active editor is another editJSON session editor...
        if (vscode.window.activeTextEditor &&
            vscode.window.activeTextEditor.document.fileName === this.lastJSONEditorPath) {

            // Try to close the last temporary editor - vscode doesn't provide close editor API so do it hacky way
            await vscode.window.activeTextEditor.document.save();

            // Check again in case the editor is not the original one
            if (vscode.window.activeTextEditor &&
                vscode.window.activeTextEditor.document.fileName === this.lastJSONEditorPath) {
                await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
            }
            void vscode.window.showWarningMessage(__('util.editjson.previousexpired'));
        }
        let content: string | undefined;
        if (schemaFile) {
            if (!filePath.endsWith('.jsonc')) {
                filePath += 'c';
            }
            content = await this.generateCommentedJSON(obj, schemaFile);
        } else {
            content = JSON.stringify(obj, null, 4);
        }
        await fs.writeFile(filePath, content);

        const jsonShowOptions: vscode.TextDocumentShowOptions = { preview: false };
        if (highlightKey && content) {
            const selection: vscode.Selection | undefined = this.getJsonValueSelection(content, highlightKey);
            if (selection) {
                jsonShowOptions.selection = selection;
            }
        }
        const editor: vscode.TextEditor = await vscode.window.showTextDocument(vscode.Uri.file(filePath), jsonShowOptions);

        // DO NOT use filePath - there may be difference with drive letters ('C' vs 'c')
        this.lastJSONEditorPath = editor.document.fileName;

        try {
            while (true) {
                // Only error message won't be collapsed automatically by vscode.
                const result: string | undefined = await vscode.window.showErrorMessage(
                    __('util.editjson.prompt'),
                    this.FINISH, this.CANCEL
                );
                if (result === this.FINISH) {
                    await editor.document.save();
                    try {
                        const editedObject: T & object = parse(editor.document.getText());
                        if (schemaFile) {
                            const error: string | undefined = await this.validateJSON(editedObject, schemaFile);
                            if (error) {
                                this.err('util.editjson.validationerror', [error]);
                                continue;
                            }
                        }
                        return editedObject;
                    } catch (ex) {
                        this.err('util.editjson.parseerror', [ex]);
                        continue;
                    }
                }
                return;
            }
        } finally {
            // Try to close the temporary editor - vscode doesn't provide close editor API so do it hacky way
            // Note: The editor may have already been closed, either by user or by another editJSON session.
            if (vscode.window.activeTextEditor === editor) {
                await editor.document.save();

                // Check again in case the editor is not the original one
                if (vscode.window.activeTextEditor === editor) {
                    await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
                }
            }
            await this.cleanTempDirectory(tempPath);
        }
    }

    public async validateJSON(obj: object, schemaFile: string): Promise<string | undefined> {
        let validateFnPromise: PromiseLike<Ajv.ValidateFunction>;
        if (!this.schemaPromises.has(schemaFile)) {
            const schemaJSON: object = await this.loadSchema(schemaFile);
            validateFnPromise = this.ajv.compileAsync(schemaJSON);
            this.schemaPromises.set(schemaFile, validateFnPromise);
        } else {
            validateFnPromise = this.schemaPromises.get(schemaFile)!;
        }
        const validateFn: Ajv.ValidateFunction = await validateFnPromise;
        if (validateFn(obj)) {
            return undefined;
        }
        if (!validateFn.errors) {
            return __('util.validatejson.error');
        }
        const error: Ajv.ErrorObject = validateFn.errors[0];
        return `${error.dataPath}: ${error.message}`;
    }

    public async pick<T extends vscode.QuickPickItem>(options: T[], placeHolder: string): Promise<T | undefined>;
    public async pick<T>(options: T[], placeHolder: string, fnToQuickPickItem: (obj: T) => vscode.QuickPickItem): Promise<T | undefined>;
    public async pick<T>(options: T[], placeHolder: string, fnToQuickPickItem?: (obj: T) => vscode.QuickPickItem): Promise<T | undefined> {
        type IQuickPickItemInternal = vscode.QuickPickItem & { index?: number };
        const items: IQuickPickItemInternal[] = options.map((obj, index) => {
            const result: IQuickPickItemInternal = fnToQuickPickItem ? fnToQuickPickItem(obj) : <any>obj;
            result.index = index;
            return result;
        });
        const pickResult: IQuickPickItemInternal | undefined = await vscode.window.showQuickPick(items, {
            matchOnDescription: true, matchOnDetail: true, placeHolder
        });
        if (!pickResult) {
            return undefined;
        } else {
            return options[pickResult.index || 0];
        }
    }

    public async pickWorkspaceFolder(): Promise<vscode.WorkspaceFolder | undefined> {
        let folders: vscode.WorkspaceFolder[] | undefined = vscode.workspace.workspaceFolders;
        if (!folders) {
            throw new Error(__('common.workspace.nofolder'));
        }
        folders = folders.filter(folder => folder.uri.scheme === 'file');
        if (folders.length === 0) {
            throw new Error(__('common.workspace.nofolder'));
        }
        if (folders.length === 1) {
            return folders[0];
        }

        return this.pick(folders, __('common.workspace.pick'), folder => ({
            label: folder.name,
            detail: folder.uri.fsPath
        }));
    }

    public fixURL(url: string, https?: boolean): string {
        if (!/^[a-zA-Z]+?\:\/\//.test(url)) {
            url = `http${https ? 's' : ''}://` + url;
        }
        return url;
    }

    public async openExternally(url: string): Promise<void> {
        url = Util.fixURL(url);
        try {
            await opn(url, { wait: false });
        } catch (ex) {
            void vscode.window.showWarningMessage(__('util.openexternally.fail', [ex]));
        }
    }

    public quote(p: string): string {
        if (os.platform() === 'win32') {
            return `"${p}"`;
        } else {
            return `'${p}'`;
        }
    }

    public async onDeactivate(): Promise<void> {
        await Promise.all(Array.from(this.tempDirectories).map(dir => fs.remove(dir)));
    }

    private schemaPath(uri: string): string {
        return this.resolvePath(path.join(UtilClass.SCHEMAS_DIR, uri));
    }

    private loadSchema(uri: string): Promise<object> {
        return fs.readJSON(this.schemaPath(uri));
    }
}