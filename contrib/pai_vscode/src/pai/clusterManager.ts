/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */

import { injectable } from 'inversify';
import { clone, range } from 'lodash';
import * as request from 'request-promise-native';
import * as vscode from 'vscode';

import {
    COMMAND_ADD_CLUSTER, COMMAND_DELETE_CLUSTER, COMMAND_EDIT_CLUSTER
} from '../common/constants';
import { __ } from '../common/i18n';
import { getSingleton, Singleton } from '../common/singleton';
import { Util } from '../common/util';
import { ConfigurationNode, ConfigurationTreeDataProvider } from './configurationTreeDataProvider';
import { IPAICluster } from './paiInterface';

import semverCompare = require('semver-compare'); // tslint:disable-line
export interface IConfiguration {
    readonly version: string;
    pais: IPAICluster[];
}

export function getClusterIdentifier(conf: IPAICluster): string {
    return `${conf.username}@${conf.rest_server_uri}`;
}

export function getClusterName(conf: IPAICluster): string {
    return conf.name || getClusterIdentifier(conf);
}

export function getClusterWebPortalUri(conf: IPAICluster): string {
    return conf.web_portal_uri || conf.rest_server_uri.split(':')[0];
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
        rest_server_uri: '127.0.0.1:9186',
        webhdfs_uri: '127.0.0.1:50070',
        grafana_uri: '127.0.0.1:3000',
        k8s_dashboard_uri: '127.0.0.1:9090'
    };

    private readonly EDIT: string = __('common.edit');
    private readonly DISCARD: string = __('cluster.activate.fix.discard');

    private configuration: IConfiguration | undefined;

    public async onActivate(): Promise<void> {
        this.context.subscriptions.push(
            vscode.commands.registerCommand(COMMAND_ADD_CLUSTER, () => this.add()),
            vscode.commands.registerCommand(COMMAND_EDIT_CLUSTER, (node: ConfigurationNode) => this.edit(node.index)),
            vscode.commands.registerCommand(COMMAND_DELETE_CLUSTER, (node: ConfigurationNode) => this.delete(node.index))
        );
        this.configuration = this.context.globalState.get<IConfiguration>(ClusterManager.CONF_KEY) || ClusterManager.default;
        try {
            await this.validateConfiguration();
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

    public get allConfigurations(): IPAICluster[] {
        return this.configuration!.pais;
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
            cluster.web_portal_uri = `${host}/`;
            cluster.webhdfs_uri = `${host}/webhdfs/api/v1`;
        } catch {
            cluster.name = host;
            cluster.rest_server_uri = `${host}:9186`;
            cluster.webhdfs_uri = `${host}:50070/webhdfs/v1`;
            cluster.grafana_uri = `${host}:3000`;
            cluster.web_portal_uri = `${host}`;
            cluster.k8s_dashboard_uri = `${host}:9090`;
        }
        return this.edit(this.configuration!.pais.length, cluster);
    }

    public async edit(index: number, defaultConfiguration: IPAICluster = ClusterManager.paiDefault): Promise<void> {
        const original: IPAICluster = this.configuration!.pais[index] || defaultConfiguration;
        const editResult: IPAICluster | undefined = await Util.editJSON(
            original,
            `pai_cluster_${original.rest_server_uri}.json`,
            'pai_cluster.schema.json'
        );
        if (editResult) {
            this.configuration!.pais[index] = editResult;
            await (await getSingleton(ConfigurationTreeDataProvider)).refresh(index);
            await this.save();
        }
    }

    public async delete(index: number): Promise<void> {
        this.configuration!.pais.splice(index, 1);
        await (await getSingleton(ConfigurationTreeDataProvider)).refresh();
        await this.save();
    }

    public save(): PromiseLike<void> {
        return this.context.globalState.update(ClusterManager.CONF_KEY, this.configuration!);
    }

    public async pick(): Promise<number | undefined> {
        if (this.configuration!.pais.length === 1) {
            return 0;
        }
        return await Util.pick(range(this.configuration!.pais.length), __('cluster.pick.prompt'), (index: number) => {
            const conf: IPAICluster = this.allConfigurations![index];
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
                    await (await getSingleton(ConfigurationTreeDataProvider)).refresh();
                    await this.save();
                }
                break;

            case this.DISCARD:
            case undefined:
            default:
                break;
        }
    }
}