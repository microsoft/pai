/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */

import { injectable } from 'inversify';
import { clone, range } from 'lodash';
import { IAuthnInfo, ILoginInfo, OpenPAIClient } from 'openpai-js-sdk';
import * as request from 'request-promise-native';
import * as vscode from 'vscode';

import {
    COMMAND_ADD_CLUSTER, COMMAND_DELETE_CLUSTER, COMMAND_EDIT_CLUSTER} from '../common/constants';
import { __ } from '../common/i18n';
import { getSingleton, Singleton } from '../common/singleton';
import { Util } from '../common/util';

import { ClusterExplorerChildNode, ConfigurationTreeDataProvider, ITreeData } from './configurationTreeDataProvider';
import { IPAICluster } from './paiInterface';

import semverCompare = require('semver-compare'); // tslint:disable-line
import { login } from './azureADLogin';

export interface IConfiguration {
    readonly version: string;
    pais: IPAICluster[];
}

export type IClusterModification = {
    index: number;
    type: 'EDIT' | 'REMOVE';
} | {
    type: 'RESET';
};

export function getClusterIdentifier(conf: IPAICluster): string {
    return `${conf.username}@${conf.rest_server_uri}`;
}

export function getClusterName(conf: IPAICluster): string {
    return conf.name || getClusterIdentifier(conf);
}

/**
 * Manager class for cluster configurations
 */
@injectable()
export class ClusterManager extends Singleton {
    private static readonly CONF_KEY: string = 'openpai.conf';
    private static readonly default: IConfiguration = {
        version: '0.0.1',
        pais: []
    };
    private static readonly paiDefault: IPAICluster = {
        name: 'Sample Cluster',
        username: '',
        password: '',
        token: '',
        rest_server_uri: '127.0.0.1:9186',
        hdfs_uri: 'hdfs://127.0.0.1:9000',
        webhdfs_uri: '127.0.0.1:50070',
        grafana_uri: '127.0.0.1:3000',
        k8s_dashboard_uri: '127.0.0.1:9090',
        protocol_version: '2'
    };

    private onDidChangeEmitter: vscode.EventEmitter<IClusterModification> = new vscode.EventEmitter<IClusterModification>();
    public onDidChange: vscode.Event<IClusterModification> = this.onDidChangeEmitter.event; // tslint:disable-line

    private readonly EDIT: string = __('common.edit');
    private readonly DISCARD: string = __('cluster.activate.fix.discard');

    private configuration: IConfiguration | undefined;

    public async onActivate(): Promise<void> {
        this.context.subscriptions.push(
            vscode.commands.registerCommand(COMMAND_ADD_CLUSTER, () => this.add()),
            vscode.commands.registerCommand(COMMAND_EDIT_CLUSTER, async (node: ClusterExplorerChildNode | ITreeData) => {
                if (node instanceof ClusterExplorerChildNode) {
                    await this.edit(node.index);
                } else {
                    await this.edit(node.clusterIndex);
                }
            }),
            vscode.commands.registerCommand(COMMAND_DELETE_CLUSTER, async (node: ClusterExplorerChildNode | ITreeData) => {
                if (node instanceof ClusterExplorerChildNode) {
                    await this.delete(node.index);
                } else {
                    await this.delete(node.clusterIndex);
                }
            })
        );
        this.configuration = this.context.globalState.get<IConfiguration>(ClusterManager.CONF_KEY) || ClusterManager.default;
        try {
            await this.validateConfiguration();
            await this.ensureProtocolVersion();
        } catch (ex) {
            await this.askConfigurationFix(__('cluster.activate.error', [ex]));
        }
    }

    public async validateConfiguration(): Promise<void> {
        if (semverCompare(ClusterManager.default.version, this.configuration!.version) < 0) {
            throw __('cluster.version.warning');
        }
        const validateResult: string | undefined = await Util.validateJSON(this.configuration!, 'pai_configuration.schema.json');
        if (validateResult) {
            throw validateResult;
        }
    }

    public async ensureProtocolVersion(): Promise<void> {
        let updated: Boolean = true;
        const list: Promise<any>[] = [];
        this.configuration!.pais.forEach((config: IPAICluster, i, pais) => {
            if (!config.protocol_version) {
                updated = true;
                list.push(request
                    .get(`http://${config.rest_server_uri}/api/v2/jobs/protocolversion/config`, { timeout: 5 * 1000 })
                    .then(() => {
                        pais[i].protocol_version = '2';
                    })
                    .catch((err) => {
                        const error: any = JSON.parse(err.error);
                        if (error.code === 'NoApiError') {
                            pais[i].protocol_version = '1';
                        } else {
                            pais[i].protocol_version = '2';
                        }
                    }));
            }
        });

        if (updated) {
            await Promise.all(list).then(async () => await this.save());
        }
    }

    public get allConfigurations(): IPAICluster[] {
        return this.configuration!.pais;
    }

    public async autoAddOIDCUserInfo(cluster: IPAICluster): Promise<void> {
        try {
            const client: OpenPAIClient = new OpenPAIClient({
                rest_server_uri: cluster.rest_server_uri
            });

            const authnInfo: IAuthnInfo = await client.authn.info();

            if (authnInfo.authn_type === 'OIDC') {
                const loginInfo: ILoginInfo = await login(
                    `https://${cluster.rest_server_uri}`,
                    `https://${cluster.web_portal_uri}`,
                    async () => {
                        const response: string | undefined = await vscode.window.showInformationMessage(
                            // tslint:disable-next-line: no-multiline-string
                            __('cluster.login.timeout'),
                            __('cluster.login.openPortal'));
                        if (response) {
                            cluster.username = '';
                            cluster.token = '';
                            cluster.password = undefined;
                            await Util.openExternally(cluster.web_portal_uri!);
                        }
                    }
                );

                let clusterToken: string = loginInfo.token;

                try {
                    const response: any = await client.authn.createApplicationToken(clusterToken);
                    clusterToken = response.token;
                } catch (error) {
                    console.log('Get application token fail, use user token.');
                }

                cluster.username = loginInfo.user;
                cluster.token = clusterToken;
                cluster.password = undefined;
            }
        } catch (ex) {
            cluster.token = '';
        }
    }

    public async add(): Promise<void> {
        const host: string | undefined = await vscode.window.showInputBox({
            prompt: __('cluster.add.host.prompt'),
            validateInput: (val: string): string => {
                if (!val) {
                    return __('cluster.add.host.empty');
                }
                if (val.includes('/')) {
                    return __('cluster.add.host.invalidchar');
                }
                return '';
            }
        });
        if (!host) {
            return;
        }

        const cluster: IPAICluster = clone(ClusterManager.paiDefault);
        try {
            await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: __('cluster.add.checkstatus'),
                cancellable: true
            },
            (progress, cancellationToken) => new Promise((resolve, reject) => {
                const req: request.RequestPromise = request.get(`http://${host}/healthz`, { timeout: 5 * 1000 });
                cancellationToken.onCancellationRequested(() => {
                    req.abort();
                    reject();
                });
                req.then(resolve).catch(reject);
            }));
            cluster.name = host;
            cluster.rest_server_uri = `${host}/rest-server`;
            cluster.k8s_dashboard_uri = `${host}/kubernetes-dashboard`;
            cluster.grafana_uri = `${host}/grafana`;
            cluster.web_portal_uri = `${host}`;
            cluster.hdfs_uri = `hdfs://${host}:9000`;
            cluster.webhdfs_uri = `${host}/webhdfs/api/v1`;
            await this.autoAddOIDCUserInfo(cluster);
        } catch {
            cluster.name = host;
            cluster.rest_server_uri = `${host}:9186`;
            cluster.webhdfs_uri = `${host}:50070/webhdfs/v1`;
            cluster.grafana_uri = `${host}:3000`;
            cluster.web_portal_uri = `${host}`;
            cluster.hdfs_uri = `hdfs://${host}:9000`;
            cluster.k8s_dashboard_uri = `${host}:9090`;
            await this.autoAddOIDCUserInfo(cluster);
        }

        // Config the protocol version.
        try {
            await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: __('cluster.add.checkprotocolversion'),
                cancellable: true
            },
            (_progress, cancellationToken) => new Promise((resolve, reject) => {
                const req: request.RequestPromise = request
                    .get(`http://${cluster.rest_server_uri}/api/v2/jobs/protocolversion/config`, { timeout: 5 * 1000 });
                cancellationToken.onCancellationRequested(() => {
                    req.abort();
                    reject();
                });
                req.then(resolve).catch(reject);
            }));
            cluster.protocol_version = '2';
        } catch (exception) {
            try {
                const error: any = JSON.parse(exception.error);
                if (error.code === 'NoApiError') {
                    cluster.protocol_version = '1';
                } else {
                    cluster.protocol_version = '2';
                }
            } catch (err) {
                cluster.protocol_version = '2';
            }
        }

        return this.edit(this.allConfigurations.length, cluster);
    }

    public async edit(index: number, defaultConfiguration: IPAICluster = ClusterManager.paiDefault): Promise<void> {
        const original: IPAICluster = this.allConfigurations[index] || defaultConfiguration;
        const editResult: IPAICluster | undefined = await Util.editJSON(
            original,
            `pai_cluster_${original.rest_server_uri}.json`,
            'pai_cluster.schema.json'
        );
        if (editResult) {
            this.allConfigurations[index] = editResult;
            this.onDidChangeEmitter.fire({ type: 'EDIT', index });
            await this.save();
        }
    }

    public async delete(index: number): Promise<void> {
        this.allConfigurations.splice(index, 1);
        this.onDidChangeEmitter.fire({ type: 'REMOVE', index });
        await this.save();
    }

    public async save(): Promise<void> {
        await this.context.globalState.update(ClusterManager.CONF_KEY, this.configuration!);
        await (await getSingleton(ConfigurationTreeDataProvider)).refresh();
    }

    public async pick(): Promise<number | undefined> {
        if (this.allConfigurations.length === 1) {
            return 0;
        }
        return await Util.pick(range(this.allConfigurations.length), __('cluster.pick.prompt'), (index: number) => {
            const conf: IPAICluster = this.allConfigurations[index];
            return {
                label: getClusterName(conf),
                detail: getClusterIdentifier(conf)
            };
        });
    }

    private async askConfigurationFix(prompt: string): Promise<void> {
        const previousConfigurations: IConfiguration = this.configuration!;
        this.configuration = ClusterManager.default;
        const result: string | undefined = await vscode.window.showWarningMessage(
            prompt,
            this.EDIT,
            this.DISCARD
        );
        switch (result) {
            case this.EDIT:
                const editResult: IConfiguration | undefined = await Util.editJSON(
                    previousConfigurations,
                    'pai_full_configuration.json',
                    'pai_configuration.schema.json'
                );
                if (editResult) {
                    this.configuration = editResult;
                    await this.save();
                }
                break;

            case this.DISCARD:
            case undefined:
            default:
                break;
        }
        this.onDidChangeEmitter.fire({ type: 'RESET' });
    }
}