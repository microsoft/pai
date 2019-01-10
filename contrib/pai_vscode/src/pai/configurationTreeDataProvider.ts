/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */

import { injectable } from 'inversify';
import { isNil } from 'lodash';
import {
    commands, Event, EventEmitter, TreeDataProvider, TreeItem, TreeItemCollapsibleState, window,
    workspace
} from 'vscode';

import {
    COMMAND_CREATE_JOB_CONFIG, COMMAND_EDIT_CLUSTER, COMMAND_LIST_JOB, COMMAND_OPEN_HDFS,
    COMMAND_REFRESH_CLUSTER, COMMAND_SIMULATE_JOB, COMMAND_SUBMIT_JOB,
    COMMAND_TREEVIEW_DOUBLECLICK, COMMAND_TREEVIEW_OPEN_PORTAL,
    CONTEXT_CONFIGURATION_ITEM, CONTEXT_CONFIGURATION_ITEM_WEBPAGE,
    ICON_CREATE_CONFIG, ICON_DASHBOARD, ICON_EDIT, ICON_HDFS, ICON_LIST_JOB, ICON_PAI, ICON_SIMULATE_JOB, ICON_SUBMIT_JOB,
    VIEW_CONFIGURATION_TREE
} from '../common/constants';
import { __ } from '../common/i18n';
import { getSingleton, Singleton } from '../common/singleton';
import { Util } from '../common/util';
import { ClusterManager, getClusterName } from './clusterManager';
import { IPAICluster } from './paiInterface';

interface IChildNodeDefinition {
    title: string;
    command: string;
    icon: string | { light: string, dark: string };
    type?: { new(...args: any[]): TreeNode };
    condition?(conf: IPAICluster): boolean;
}

/**
 * General tree node recording its parent
 */
class TreeNode extends TreeItem {
    constructor(title: string, public readonly parent?: TreeNode) {
        super(title, parent ? TreeItemCollapsibleState.None : TreeItemCollapsibleState.Expanded);
    }
}

/**
 * Tree node representing external link
 */
class TreeNodeWithLink extends TreeNode {
    constructor(title: string, parent?: TreeNode) {
        super(title, parent);
        this.contextValue = CONTEXT_CONFIGURATION_ITEM_WEBPAGE;
    }

    public get realCommand(): string | undefined {
        return this.command && this.command.arguments && this.command.arguments[1];
    }
}

const childNodeDefinitions: IChildNodeDefinition[] = [
    {
        title: 'treeview.node.openPortal',
        command: COMMAND_TREEVIEW_OPEN_PORTAL,
        icon: ICON_DASHBOARD,
        type: TreeNodeWithLink
    },
    {
        title: 'treeview.node.listjob',
        command: COMMAND_LIST_JOB,
        icon: ICON_LIST_JOB,
        type: TreeNodeWithLink
    },
    {
        title: 'treeview.node.create-config',
        command: COMMAND_CREATE_JOB_CONFIG,
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

/**
 * Root nodes representing cluster configuration
 */
export class ConfigurationNode extends TreeNode {
    public children: TreeNode[] = [];

    public constructor(private _configuration: IPAICluster, public readonly index: number) {
        super('...');
        this.iconPath = Util.resolvePath(ICON_PAI);
        this.configuration = this._configuration;
        this.contextValue = CONTEXT_CONFIGURATION_ITEM;
    }

    public get configuration(): IPAICluster {
        return this._configuration;
    }
    public set configuration(to: IPAICluster) {
        this.label = getClusterName(to);
        this._configuration = to;
        this.initializeChildren();
    }

    private initializeChildren(): void {
        this.children = [];
        for (const def of childNodeDefinitions) {
            if (def.condition && !def.condition(this.configuration)) {
                continue;
            }
            const node: TreeNode = new (def.type || TreeNode)(__(def.title), this);
            node.command = {
                title: __(def.title),
                command: COMMAND_TREEVIEW_DOUBLECLICK,
                arguments: [this, def.command]
            };
            node.iconPath = Util.resolvePath(def.icon);
            this.children.push(node);
        }
    }
}

/**
 * Contributes to the tree view of cluster configurations
 */
@injectable()
export class ConfigurationTreeDataProvider extends Singleton implements TreeDataProvider<TreeNode> {
    private onDidChangeTreeDataEmitter: EventEmitter<TreeNode> = new EventEmitter<TreeNode>();
    public onDidChangeTreeData: Event<TreeNode> = this.onDidChangeTreeDataEmitter.event; // tslint:disable-line

    private configurationNodes: ConfigurationNode[] = [];
    private lastClick?: { command: string, time: number };
    private readonly doubleClickInterval: number = 300;

    constructor() {
        super();
        this.context.subscriptions.push(
            commands.registerCommand(COMMAND_REFRESH_CLUSTER, index => this.refresh(index)),
            commands.registerCommand(COMMAND_TREEVIEW_DOUBLECLICK, (node: TreeNode, command: string) => {
                const mode: string | undefined = workspace.getConfiguration('workbench.list').get('openMode');
                if (mode === 'doubleClick') {
                    void commands.executeCommand(command, node);
                } else {
                    // Single Click
                    if (
                        !isNil(this.lastClick) &&
                        this.lastClick.command === command &&
                        Date.now() - this.lastClick.time < this.doubleClickInterval
                    ) {
                        this.lastClick = undefined;
                        void commands.executeCommand(command, node);
                    } else {
                        this.lastClick = { command, time: Date.now() };
                    }
                }
            }),
            window.registerTreeDataProvider(VIEW_CONFIGURATION_TREE, this)
        );
    }

    public async refresh(index: number = -1): Promise<void> {
        const allConfigurations: IPAICluster[] = (await getSingleton(ClusterManager)).allConfigurations;
        if (index === -1 || !this.configurationNodes[index]) {
            this.configurationNodes = allConfigurations.map((conf, i) => new ConfigurationNode(conf, i));
            this.onDidChangeTreeDataEmitter.fire();
        } else {
            this.configurationNodes[index].configuration = allConfigurations[index];
            this.onDidChangeTreeDataEmitter.fire(this.configurationNodes[index]);
        }
    }

    public getTreeItem(element: TreeNode): TreeNode {
        return element;
    }

    public getChildren(element?: TreeNode): TreeNode[] | undefined {
        if (!element) {
            // Root nodes: configurations
            return this.configurationNodes;
        }
        if (element instanceof ConfigurationNode) {
            return element.children;
        }
        return;
    }

    public getParent(element: TreeNode): TreeNode | undefined {
        return element.parent;
    }

    public onActivate(): Promise<void> {
        return this.refresh();
    }
}