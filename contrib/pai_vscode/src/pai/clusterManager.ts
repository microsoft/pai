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
    COMMAND_ADD_CLUSTER, COMMAND_DELETE_CLUSTER, COMMAND_EDIT_CLUSTER, SETTING_JOB_JOBLIST_RECENTJOBSLENGTH, SETTING_SECTION_JOB
} from '../common/constants';
import { __ } from '../common/i18n';
import { getSingleton, Singleton } from '../common/singleton';
import { Util } from '../common/util';

import { ConfigurationNode, ConfigurationTreeDataProvider } from './configurationTreeDataProvider';
import { IPAICluster } from './paiInterface';

import semverCompare = require('semver-compare'); // tslint:disable-line
import { JobListTreeDataProvider } from './container/jobListTreeView';
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

/**
 * Manager class for cluster configurations
 */
@injectable()
export class ClusterManager extends Singleton {
    private static readonly CONF_KEY: string = 'openpai.conf';
    private static readonly RECENT_JOBS_KEY: string = 'openpai.recentJobs';
    private static readonly default: IConfiguration = {
        version: '0.0.1',
        pais: []
    };
    private static readonly paiDefault: IPAICluster = {
        name: 'Sample Cluster',
        username: '',
        password: '',
        rest_server_uri: '127.0.0.1:9186',
        hdfs_uri: 'hdfs://127.0.0.1:9000',
        webhdfs_uri: '127.0.0.1:50070',
        grafana_uri: '127.0.0.1:3000',
        k8s_dashboard_uri: '127.0.0.1:9090'
    };

    private readonly EDIT: string = __('common.edit');
    private readonly DISCARD: string = __('cluster.activate.fix.discard');

    private configuration: IConfiguration | undefined;
    private recentJobs: string[][] | undefined;

    public async onActivate(): Promise<void> {
        this.context.subscriptions.push(
            vscode.commands.registerCommand(COMMAND_ADD_CLUSTER, () => this.add()),
            vscode.commands.registerCommand(COMMAND_EDIT_CLUSTER, (node: ConfigurationNode) => this.edit(node.index)),
            vscode.commands.registerCommand(COMMAND_DELETE_CLUSTER, (node: ConfigurationNode) => this.delete(node.index))
        );
        this.configuration = this.context.globalState.get<IConfiguration>(ClusterManager.CONF_KEY) || ClusterManager.default;
        this.recentJobs = this.context.globalState.get<string[][]>(ClusterManager.RECENT_JOBS_KEY) || [];
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

    public get allRecentJobs(): string[][] {
        return this.recentJobs!;
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
            cluster.hdfs_uri = `hdfs://${host}:9000`;
            cluster.webhdfs_uri = `${host}/webhdfs/api/v1`;
        } catch {
            cluster.name = host;
            cluster.rest_server_uri = `${host}:9186`;
            cluster.webhdfs_uri = `${host}:50070/webhdfs/v1`;
            cluster.grafana_uri = `${host}:3000`;
            cluster.web_portal_uri = `${host}`;
            cluster.hdfs_uri = `hdfs://${host}:9000`;
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
            this.recentJobs![index] = [];
            await this.save();
            await this.saveRecentJobs(index);
        }
    }

    public async delete(index: number): Promise<void> {
        this.configuration!.pais.splice(index, 1);
        this.recentJobs!.splice(index, 1);
        await this.save();
        await this.saveRecentJobs();
    }

    public async save(): Promise<void> {
        await this.context.globalState.update(ClusterManager.CONF_KEY, this.configuration!);
        await (await getSingleton(ConfigurationTreeDataProvider)).refresh();
    }

    public async saveRecentJobs(index: number = -1): Promise<void> {
        await this.context.globalState.update(ClusterManager.RECENT_JOBS_KEY, this.recentJobs!);
        await (await getSingleton(JobListTreeDataProvider)).refresh(index);
    }

    public async enqueueRecentJobs(cluster: IPAICluster, jobName: string): Promise<void> {
        const index: number = this.allConfigurations.findIndex(c => c === cluster);
        if (index === -1) {
            return;
        }
        const list: string[] = this.recentJobs![index] = this.recentJobs![index] || [];
        list.unshift(jobName);
        const settings: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration(SETTING_SECTION_JOB);
        const maxLen: number = settings.get(SETTING_JOB_JOBLIST_RECENTJOBSLENGTH) || 5;
        list.splice(maxLen); // Make sure not longer than maxLen
        await this.saveRecentJobs(index);
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
                    await this.save();
                }
                break;

            case this.DISCARD:
            case undefined:
            default:
                break;
        }
        this.recentJobs = [];
        await this.saveRecentJobs();
    }
}