/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */

import { injectable } from 'inversify';
import * as vscode from 'vscode';

import {
    COMMAND_LIST_JOB, COMMAND_OPEN_DASHBOARD, COMMAND_TREEVIEW_OPEN_PORTAL, COMMAND_VIEW_JOB
} from '../common/constants';
import { __ } from '../common/i18n';
import { getSingleton, Singleton } from '../common/singleton';
import { Util } from '../common/util';

import { getClusterName, ClusterManager } from './clusterManager';
import { ClusterExplorerChildNode } from './configurationTreeDataProvider';
import { ClusterNode } from './container/jobListTreeView';
import { IPAICluster, IPAIJobInfo } from './paiInterface';
import { PAIWebPortalUri } from './paiUri';

const paiDashboardPropertyLabelMapping: { [propertyName: string]: string } = {
    grafana_uri: 'Grafana',
    k8s_dashboard_uri: 'Kubernates',
    webhdfs_uri: 'Webhdfs'
};

/**
 * Provides functionalities to open webpages on PAI
 */
@injectable()
export class PAIWebpages extends Singleton {

    constructor() {
        super();
        this.context.subscriptions.push(
            vscode.commands.registerCommand(
                COMMAND_OPEN_DASHBOARD,
                this.openDashboard.bind(this)
            ),
            vscode.commands.registerCommand(
                COMMAND_TREEVIEW_OPEN_PORTAL,
                (node: ClusterExplorerChildNode) => this.openDashboardFromTreeView(node.index)
            ),
            vscode.commands.registerCommand(
                COMMAND_LIST_JOB,
                (node: ClusterExplorerChildNode | ClusterNode) => this.listJobs(node.index)
            ),
            vscode.commands.registerCommand(
                COMMAND_VIEW_JOB,
                this.viewJob.bind(this)
            )
        );
    }

    public async openDashboard(): Promise<void> {
        const index: number | undefined = await (await getSingleton(ClusterManager)).pick();
        if (index === undefined) {
            return;
        }
        const config: IPAICluster = (await getSingleton(ClusterManager)).allConfigurations![index];

        const options: vscode.QuickPickItem[] = [];
        const paiUrl: string = PAIWebPortalUri.getClusterWebPortalUri(config);
        options.push({
            label: __('webpage.dashboard.webportal', [getClusterName(config)]),
            detail: paiUrl
        });

        for (const key of Object.keys(paiDashboardPropertyLabelMapping)) {
            if (key in config) {
                options.push({
                    label: paiDashboardPropertyLabelMapping[key],
                    detail: (<any>config)[key]
                });
            }
        }

        const result: vscode.QuickPickItem | undefined = await Util.pick(
            options,
            __('webpage.dashboard.pick.prompt')
        );
        if (!result) {
            Util.err('webpage.dashboard.pick.error');
        } else if (result.detail) {
            await Util.openExternally(result.detail);
        }
    }

    public async openDashboardFromTreeView(index: number): Promise<void> {
        const config: IPAICluster = (await getSingleton(ClusterManager)).allConfigurations![index];
        const url: string = PAIWebPortalUri.getClusterWebPortalUri(config);
        await Util.openExternally(url);
    }

    public async listJobs(index: number): Promise<void> {
        const config: IPAICluster = (await getSingleton(ClusterManager)).allConfigurations![index];
        const url: string = await PAIWebPortalUri.jobs(config);
        await Util.openExternally(url);
    }

    public async viewJob(jobInfo: IPAIJobInfo, config: IPAICluster): Promise<void> {
        const url: string = await PAIWebPortalUri.jobDetail(config, jobInfo.username, jobInfo.name);
        await Util.openExternally(url);
    }
}
