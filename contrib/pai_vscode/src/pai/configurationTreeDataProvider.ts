/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */

import { injectable } from 'inversify';
import {
    commands, window,
    Event, EventEmitter, TreeDataProvider, TreeItem, TreeItemCollapsibleState
} from 'vscode';

import {
    COMMAND_CREATE_JOB_CONFIG, COMMAND_CREATE_YAML_JOB_CONFIG, COMMAND_EDIT_CLUSTER, COMMAND_LIST_JOB, COMMAND_OPEN_HDFS,
    COMMAND_REFRESH_CLUSTER, COMMAND_SIMULATE_JOB, COMMAND_SUBMIT_JOB,
    COMMAND_TREEVIEW_DOUBLECLICK, COMMAND_TREEVIEW_OPEN_PORTAL,
    CONTEXT_CONFIGURATION_ITEM,
    ICON_CREATE_CONFIG, ICON_DASHBOARD, ICON_EDIT, ICON_HDFS, ICON_LIST_JOB, ICON_PAI, ICON_SIMULATE_JOB, ICON_SUBMIT_JOB,
    VIEW_CONFIGURATION_TREE
} from '../common/constants';
import { __ } from '../common/i18n';
import { getSingleton, Singleton } from '../common/singleton';
import { Util } from '../common/util';

import { getClusterName, ClusterManager } from './clusterManager';
import { IPAICluster } from './paiInterface';

interface IChildNodeDefinition {
    title: string;
    command: string;
    icon: string | { light: string, dark: string };
    condition?(conf: IPAICluster): boolean;
}

const childNodeDefinitions: IChildNodeDefinition[] = [
    {
        title: 'treeview.node.openPortal',
        command: COMMAND_TREEVIEW_OPEN_PORTAL,
        icon: ICON_DASHBOARD
    },
    {
        title: 'treeview.node.listjob',
        command: COMMAND_LIST_JOB,
        icon: ICON_LIST_JOB
    },
    {
        title: 'treeview.node.create-config',
        command: COMMAND_CREATE_JOB_CONFIG,
        icon: ICON_CREATE_CONFIG
    },
    {
        title: 'treeview.node.create-yaml-config',
        command: COMMAND_CREATE_YAML_JOB_CONFIG,
        icon: ICON_CREATE_CONFIG
    },
    {
        title: 'treeview.node.submitjob',
        command: COMMAND_SUBMIT_JOB,
        icon: ICON_SUBMIT_JOB
    },
    {
        title: 'treeview.node.simulate',
        command: COMMAND_SIMULATE_JOB,
        icon: ICON_SIMULATE_JOB
    },
    {
        title: 'treeview.node.edit',
        command: COMMAND_EDIT_CLUSTER,
        icon: ICON_EDIT
    },
    {
        title: 'treeview.node.openhdfs',
        command: COMMAND_OPEN_HDFS,
        icon: ICON_HDFS,
        condition: (conf: IPAICluster): boolean => !!conf.webhdfs_uri
    }
];

export interface ITreeData {
    clusterIndex: number;
    childDef?: IChildNodeDefinition;
}

/**
 * Root nodes representing cluster configuration
 */
export class ClusterExplorerRootNode extends TreeItem {
    public readonly index: number;

    public constructor(configuration: IPAICluster, index: number) {
        super(getClusterName(configuration), TreeItemCollapsibleState.Expanded);
        this.iconPath = Util.resolvePath(ICON_PAI);
        this.index = index;
        this.contextValue = CONTEXT_CONFIGURATION_ITEM;
    }
}

/**
 * Child nodes representing operation
 */
export class ClusterExplorerChildNode extends TreeItem {
    public readonly index: number;

    public constructor(clusterIndex: number, def: IChildNodeDefinition) {
        super(__(def.title), TreeItemCollapsibleState.None);
        this.iconPath = Util.resolvePath(def.icon);
        this.index = clusterIndex;
        this.command = {
            title: __(def.title),
            command: COMMAND_TREEVIEW_DOUBLECLICK,
            arguments: [def.command, this]
        };
    }
}

/**
 * Contributes to the tree view of cluster configurations
 */
@injectable()
export class ConfigurationTreeDataProvider extends Singleton implements TreeDataProvider<ITreeData> {
    private onDidChangeTreeDataEmitter: EventEmitter<ITreeData> = new EventEmitter<ITreeData>();
    public onDidChangeTreeData: Event<ITreeData> = this.onDidChangeTreeDataEmitter.event; // tslint:disable-line

    public async refresh(): Promise<void> {
        this.onDidChangeTreeDataEmitter.fire();
    }

    public async getTreeItem(data: ITreeData): Promise<TreeItem> {
        if (!data.childDef) {
            const cluster: IPAICluster = (await getSingleton(ClusterManager)).allConfigurations[data.clusterIndex];
            return new ClusterExplorerRootNode(cluster, data.clusterIndex);
        } else {
            return new ClusterExplorerChildNode(data.clusterIndex, data.childDef);
        }
    }

    public async getChildren(data?: ITreeData): Promise<ITreeData[] | undefined> {
        if (!data) {
            const allConfigurations: IPAICluster[] = (await getSingleton(ClusterManager)).allConfigurations;
            return allConfigurations.map((c, i) => ({
                clusterIndex: i
            }));
        } else if (!data.childDef) {
            const cluster: IPAICluster = (await getSingleton(ClusterManager)).allConfigurations[data.clusterIndex];
            return childNodeDefinitions.filter((def) => !def.condition || def.condition(cluster)).map(def => ({
                clusterIndex: data.clusterIndex,
                childDef: def
            }));
        } else {
            return undefined;
        }
    }

    public getParent(data: ITreeData): ITreeData | undefined {
        if (data.childDef) {
            return {
                clusterIndex: data.clusterIndex
            };
        } else {
            return undefined;
        }
    }

    public async onActivate(): Promise<void> {
        this.context.subscriptions.push(
            commands.registerCommand(COMMAND_REFRESH_CLUSTER, () => this.refresh()),
            window.registerTreeDataProvider(VIEW_CONFIGURATION_TREE, this)
        );
    }
}