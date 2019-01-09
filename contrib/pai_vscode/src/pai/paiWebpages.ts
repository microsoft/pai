/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */

import { injectable } from 'inversify';
import * as vscode from 'vscode';

import {
    COMMAND_LIST_JOB, COMMAND_OPEN_DASHBOARD, COMMAND_TREEVIEW_OPEN_PORTAL
} from '../common/constants';
import { __ } from '../common/i18n';
import { previewHtml } from '../common/previewHtml';
import { getSingleton, Singleton } from '../common/singleton';
import { Util } from '../common/util';
import { ClusterManager, getClusterName, getClusterWebPortalUri } from './clusterManager';
import { ConfigurationNode } from './configurationTreeDataProvider';
import { IPAICluster } from './paiInterface';

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
                (node: ConfigurationNode, external: boolean = false) => this.openDashboardFromTreeView(node.index, external)
            ),
            vscode.commands.registerCommand(
                COMMAND_LIST_JOB,
                (node: ConfigurationNode, external: boolean = false) => this.listJobs(node.index, external)
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
        const paiUrl: string = getClusterWebPortalUri(config);
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
            await previewHtml(result.detail, result.label);
        }
    }

    public async openDashboardFromTreeView(index: number, external: boolean): Promise<void> {
        const config: IPAICluster = (await getSingleton(ClusterManager)).allConfigurations![index];
        const url: string = getClusterWebPortalUri(config);
        if (external) {
            await Util.openExternally(url);
        } else {
            await previewHtml(url, __('webpage.dashboard.webportal', [getClusterName(config)]));
        }
    }

    public async listJobs(index: number, external: boolean): Promise<void> {
        const config: IPAICluster = (await getSingleton(ClusterManager)).allConfigurations![index];
        const url: string = getClusterWebPortalUri(config) + '/view.html';
        if (external) {
            await Util.openExternally(url);
        } else {
            await previewHtml(url, __('webpage.joblist', [getClusterName(config)]));
        }
    }
}
