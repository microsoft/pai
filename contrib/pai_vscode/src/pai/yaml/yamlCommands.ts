/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */

import * as fs from 'fs-extra';
import { injectable } from 'inversify';
import * as yaml from 'js-yaml';
import { range } from 'lodash';
import * as NodeRSA from 'node-rsa';
import * as os from 'os';
import * as path from 'path';
import * as SshPK from 'sshpk';
import {
    commands,
    languages,
    window,
    Position,
    QuickPickItem,
    SnippetString,
    TextDocument,
    TextEditor,
    Uri
} from 'vscode';

import {
    COMMAND_INSERT_JOB_CONFIG,
    COMMAND_JOB_CONFIG_INSERT_RUNTIME_PLUGIN
} from '../../common/constants';
import { __ } from '../../common/i18n';
import { getSingleton, Singleton } from '../../common/singleton';
import { Util } from '../../common/util';
import { ClusterManager } from '../clusterManager';
import { StorageHelper } from '../storage/storageHelper';
import { IPAICluster } from '../utility/paiInterface';

import {
    IYamlJobConfigSnippet,
    YamlJobConfigRuntimePlugins,
    YamlJobConfigSnippets
} from './yamlJobConfigCompletionProvider';

export interface IKeyPair {
    public: string;
    private: string;
}

export function generateSSHKeyPair(bits: number = 1024): IKeyPair {
    const key: NodeRSA = new NodeRSA({ b: bits });
    const pemPub: string = key.exportKey('pkcs1-public-pem');
    const pemPri: string = key.exportKey('pkcs1-private-pem');

    const sshKey: SshPK.Key = SshPK.parseKey(pemPub, 'pem');
    sshKey.comment = 'pai-job-ssh';
    const sshPub: string = sshKey.toString('ssh');
    return { public: sshPub, private: pemPri };
}

/**
 * Manager class for cluster configurations
 */
@injectable()
export class YamlCommands extends Singleton {
    private runtimePluginSnippets: IYamlJobConfigSnippet[] = [];
    private componentSnippets: IYamlJobConfigSnippet[] = [];

    constructor() {
        super();
        this.loadSnippets();
    }

    public async onActivate(): Promise<void> {
        this.context.subscriptions.push(
            commands.registerCommand(
                COMMAND_INSERT_JOB_CONFIG,
                async (document: TextDocument, position: Position) =>
                    this.insertJobConfig(document, position)
            ),
            commands.registerCommand(
                COMMAND_JOB_CONFIG_INSERT_RUNTIME_PLUGIN,
                async (document: TextDocument, position: Position, withoutPrefix?: boolean) =>
                    this.insertRuntimePlugin(document, position, withoutPrefix)
            ),
            languages.registerCompletionItemProvider('yaml', new YamlJobConfigSnippets()),
            languages.registerCompletionItemProvider('yaml', new YamlJobConfigRuntimePlugins(), ':')
        );
    }

    public async insertJobConfig(document: TextDocument, position: Position): Promise<void> {
        const items: QuickPickItem[] = this.componentSnippets.map(component => {
            return {
                label: component.label,
                description: component.documentation
            };
        });

        const pluginItemLabel: string = 'OpenPAI Runtime Plugin Item';
        items.push({
            label: pluginItemLabel,
            description: 'OpenPAI Runtime Plugin Item.'
        });

        const pick: number | undefined = await Util.pick(
            range(items.length),
            __('job.config.component.select'),
            (index: number) => items[index]
        );

        if (pick !== undefined) {
            const item: QuickPickItem = items[pick];
            if (item.label === pluginItemLabel) {
                await this.insertRuntimePlugin(document, position);
            } else {
                const component: IYamlJobConfigSnippet = this.componentSnippets[pick];
                const editor: TextEditor = await window.showTextDocument(document);
                await editor.insertSnippet(new SnippetString(component.insertText.trimRight()));
                if (component.name === 'openPaiRunetimePlugin') {
                    await this.insertRuntimePlugin(document, position, true);
                }
            }
        }
    }

    public async insertRuntimePlugin(
        document: TextDocument, position: Position, withoutPrefix?: boolean
    ): Promise<void> {
        if (document) {
            const linePrefix: string = position !== undefined ?
                document.lineAt(position).text.substr(0, position.character) : '';
            let prefix: string = '';
            if (!linePrefix.endsWith('- plugin:') && !withoutPrefix) {
                prefix = '- plugin:';
            }

            const pick: number | undefined = await this.pickPlugin();
            const editor: TextEditor = await window.showTextDocument(document);
            if (pick !== undefined) {
                const plugin: IYamlJobConfigSnippet = this.runtimePluginSnippets[pick];
                if (plugin.label === 'ssh') {
                    if (await this.enableUserSSH()) {
                        const publicKey: string | undefined = await this.getSshPublicKey();
                        if (publicKey === undefined) {
                            await editor.insertSnippet(new SnippetString(prefix + plugin.insertText));
                        } else {
                            await editor.insertSnippet(
                                new SnippetString(prefix + plugin.insertText.replace('\${1:<public key>}', publicKey)
                            ));
                        }
                    } else {
                        await editor.insertSnippet(
                            new SnippetString(prefix + plugin.insertText.substr(0, plugin.insertText.search('userssh:'))
                        ));
                    }
                } else if (plugin.label === 'teamwise_storage') {
                    const storage: string | undefined = await this.pickStorage();
                    if (storage === undefined) {
                        await editor.insertSnippet(new SnippetString(prefix + plugin.insertText));
                    } else {
                        await editor.insertSnippet(
                            new SnippetString(prefix + plugin.insertText.replace('\${1:<storage name>}', storage))
                        );
                    }
                } else if (plugin.label === 'tensorboard') {
                    // tslint:disable-next-line:insecure-random
                    const port: number = Math.floor(Math.random() * 5000 + 10000);
                    await editor.insertSnippet(
                        new SnippetString(prefix + plugin.insertText.replace('{port}', port.toString(10)))
                    );
                }
            }
        }
    }

    public async pickPlugin(): Promise<number | undefined> {
        return await Util.pick(
            range(this.runtimePluginSnippets.length),
            __('job.runtime.plugin.select'),
            (index: number) => {
                const snippet: IYamlJobConfigSnippet = this.runtimePluginSnippets[index];
                return {
                    label: snippet.label,
                    detail: snippet.documentation
                };
            }
        );
    }

    private async pickCluster(): Promise<IPAICluster | undefined> {
        const clusterManager: ClusterManager = await getSingleton(ClusterManager);
        const pickResult: number | undefined = await clusterManager.pick();
        if (pickResult === undefined) {
            return undefined;
        }
        return clusterManager.allConfigurations[pickResult];
    }

    private async pickStorage(): Promise<string | undefined> {
        const cluster: IPAICluster | undefined = await this.pickCluster();
        if (cluster) {
            const storages: string[] = await StorageHelper.getStorages(cluster);
            if (storages.length === 0) {
                return undefined;
            } else if (storages.length === 1) {
                return storages[0];
            }

            const pick: number | undefined = await Util.pick(
                range(storages.length),
                __('storage.upload.pick.prompt'),
                (index: number) => {
                    return { label: storages[index] };
                });
            if (pick !== undefined) {
                return storages[pick];
            } else {
                return undefined;
            }
        } else {
            return undefined;
        }
    }

    private async enableUserSSH(): Promise<boolean> {
        const YES: QuickPickItem = { label: __('common.yes') };
        const NO: QuickPickItem = { label: __('common.no') };
        const item: QuickPickItem | undefined = await Util.pick(
            [YES, NO],
            __('job.runtime.plugin.user-ssh.enable')
        );
        if (item === YES) {
            return true;
        } else {
            return false;
        }
    }

    private async getSshPublicKey(): Promise<string | undefined> {
        const GENERATE_NEW: QuickPickItem = { label: __('job.runtime.plugin.ssh.key.generator') };
        const IMPORT_FROM_FILE: QuickPickItem = { label: __('job.runtime.plugin.ssh.key.import') };
        const INPUT_MANULLY: QuickPickItem = { label: __('job.runtime.plugin.ssh.key.input') };

        const item: QuickPickItem | undefined = await Util.pick(
            [GENERATE_NEW, IMPORT_FROM_FILE, INPUT_MANULLY],
            __('job.runtime.plugin.ssh.key.select')
        );

        if (item === GENERATE_NEW) {
            const keyPair: IKeyPair = generateSSHKeyPair();
            const privateKeySaveDir: string = path.join(os.homedir(), 'privateKey.pem');
            const publicKeySaveDir: string = path.join(os.homedir(), 'publicKey.pem');

            let saveDir: Uri | undefined = await window.showSaveDialog({
                defaultUri: Uri.file(privateKeySaveDir),
                filters: { PEM: ['pem'] }
            });

            if (saveDir) {
                await fs.writeFile(saveDir.fsPath, keyPair.private);
            }

            saveDir = await window.showSaveDialog({
                defaultUri: Uri.file(publicKeySaveDir),
                filters: { PEM: ['pem'] }
            });

            if (saveDir) {
                await fs.writeFile(saveDir.fsPath, keyPair.public);
            }

            return keyPair.public;
        } else if (item === IMPORT_FROM_FILE) {
            const importDir: Uri[] | undefined = await window.showOpenDialog({
                defaultUri: Uri.parse(os.homedir()),
                filters: {
                    PEM: ['pem', '*']
                }
            });

            if (importDir && importDir.length === 1) {
                return fs.readFileSync(importDir[0].fsPath, 'utf8');
            }
        } else {
            return undefined;
        }
    }

    private loadSnippets(): void {
        const runtimePluginRoot: string = path.join(__dirname, '../../../snippets/runtimePlugins');
        this.runtimePluginSnippets = fs
            .readdirSync(runtimePluginRoot)
            .filter(x => x.endsWith('.yaml'))
            .map(f => yaml.safeLoad(fs.readFileSync(path.join(runtimePluginRoot, f), 'utf-8')));
        const componentRoot: string = path.join(__dirname, '../../../snippets');
        this.componentSnippets = fs
            .readdirSync(componentRoot)
            .filter(x => x.endsWith('.yaml'))
            .map(f => yaml.safeLoad(fs.readFileSync(path.join(componentRoot, f), 'utf-8')));
    }
}
