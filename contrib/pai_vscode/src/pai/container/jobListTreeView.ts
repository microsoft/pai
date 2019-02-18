/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */
/* tslint:disable:max-classes-per-file */

import { deepEqual } from 'assert';
import { injectable } from 'inversify';
import { flatMap, isEqual } from 'lodash';
import * as LRU from 'lru-cache';
import * as request from 'request-promise-native';
import {
    commands, window, workspace, Disposable, Event, EventEmitter, TreeDataProvider,
    TreeItem, TreeItemCollapsibleState, TreeView, WorkspaceConfiguration
} from 'vscode';

import {
    COMMAND_CONTAINER_JOBLIST_MORE, COMMAND_CONTAINER_JOBLIST_REFRESH,
    COMMAND_TREEVIEW_DOUBLECLICK, COMMAND_VIEW_JOB,
    ICON_ELLIPSIS,
    ICON_ERROR,
    ICON_HISTORY,
    ICON_LATEST,
    ICON_OK,
    ICON_PAI,
    ICON_QUEUE,
    ICON_RUN,
    ICON_STOP,
    SETTING_JOB_JOBLIST_ALLJOBSPAGESIZE,
    SETTING_JOB_JOBLIST_RECENTJOBSLENGTH,
    SETTING_JOB_JOBLIST_REFERSHINTERVAL,
    SETTING_SECTION_JOB,
    VIEW_CONTAINER_JOBLIST
} from '../../common/constants';
import { __ } from '../../common/i18n';
import { getSingleton, Singleton } from '../../common/singleton';
import { Util } from '../../common/util';
import { getClusterName, ClusterManager } from '../clusterManager';
import { IPAICluster, IPAIJobInfo } from '../paiInterface';
import { PAIRestUri } from '../paiUri';

/**
 * Base tree node
 */
class TreeNode<TP, TC> extends TreeItem {
    public children: TC[] = [];
    public constructor(label: string, public readonly parent: TP) {
        super(label);
    }
}

type AnyTreeNode = TreeNode<any, any>;

/**
 * Node representing job on PAI
 */
export class JobNode extends TreeNode<FilterNode, undefined> {
    private static statusIcons: { [status in IPAIJobInfo['state']]: string } = {
        SUCCEEDED: ICON_OK,
        FAILED: ICON_ERROR,
        WAITING: ICON_QUEUE,
        STOPPED: ICON_STOP,
        RUNNING: ICON_RUN
    };
    private static cache: LRU.Cache<string, JobNode> = new LRU(100);

    private constructor(private _jobInfo: IPAIJobInfo, parent: FilterNode) {
        super(_jobInfo.name, parent);
        this.command = {
            title: __('treeview.joblist.view'),
            command: COMMAND_TREEVIEW_DOUBLECLICK,
            arguments: [COMMAND_VIEW_JOB, this]
        };
        this.jobInfo = _jobInfo;
        JobNode.cache.set(parent.id + _jobInfo.name, this);
    }

    public get jobInfo(): IPAIJobInfo {
        return this._jobInfo;
    }
    public set jobInfo(to: IPAIJobInfo) {
        this._jobInfo = to;
        this.iconPath = Util.resolvePath(JobNode.statusIcons[this.jobInfo.state]);
    }

    public static get(jobInfo: IPAIJobInfo, parent: FilterNode): JobNode {
        const foundNode: JobNode | undefined = JobNode.cache.get(parent.id + jobInfo.name);
        if (!foundNode) {
            return new JobNode(jobInfo, parent);
        }
        foundNode.jobInfo = jobInfo;
        return foundNode;
    }
}

class ShowMoreNode extends TreeNode<FilterNode, undefined> {
    public constructor(parent: FilterNode) {
        super(__('treeview.joblist.more'), parent);
        this.command = {
            title: __('treeview.joblist.more'),
            command: COMMAND_TREEVIEW_DOUBLECLICK,
            arguments: [COMMAND_CONTAINER_JOBLIST_MORE, this]
        };
        this.iconPath = Util.resolvePath(ICON_ELLIPSIS);
    }
}

enum FilterType {
    Latest = 0,
    All = 1
}

class FilterNode extends TreeNode<ConfigurationNode, JobNode | ShowMoreNode> {
    public constructor(parent: ConfigurationNode, type: FilterType) {
        if (type === FilterType.Latest) {
            super(__('treeview.joblist.recent'), parent);
            this.collapsibleState = TreeItemCollapsibleState.Expanded;
            this.iconPath = Util.resolvePath(ICON_LATEST);
        } else {
            super(__('treeview.joblist.all'), parent);
            this.collapsibleState = TreeItemCollapsibleState.Collapsed;
            this.iconPath = Util.resolvePath(ICON_HISTORY);
        }
    }
}

/**
 * Root nodes representing cluster configuration
 */
export class ConfigurationNode extends TreeNode<undefined, FilterNode> {
    public shownAmount: number;

    private onDidChangeEmitter: EventEmitter<JobNode> = new EventEmitter<JobNode>();
    public onDidChange: Event<JobNode> = this.onDidChangeEmitter.event; // tslint:disable-line

    private jobs: IPAIJobInfo[] = [];
    private lastLatestJobName: string | undefined;

    public constructor(private _configuration: IPAICluster, public readonly index: number) {
        super('...', undefined);
        this.iconPath = Util.resolvePath(ICON_PAI);
        this.configuration = this._configuration;
        this.children = [
            new FilterNode(this, FilterType.Latest),
            new FilterNode(this, FilterType.All)
        ];
        this.collapsibleState = TreeItemCollapsibleState.Collapsed;
        const settings: WorkspaceConfiguration = workspace.getConfiguration(SETTING_SECTION_JOB);
        this.shownAmount = settings.get(SETTING_JOB_JOBLIST_ALLJOBSPAGESIZE) || 20;
    }

    public get configuration(): IPAICluster {
        return this._configuration;
    }
    public set configuration(to: IPAICluster) {
        this.label = getClusterName(to);
        this._configuration = to;
    }

    public async loadJobs(): Promise<void> {
        const newJobs: IPAIJobInfo[] = await request.get(PAIRestUri.jobs(this.configuration), { json: true });
        if (isEqual(this.jobs, newJobs)) {
            return;
        }
        this.jobs = newJobs;
        const settings: WorkspaceConfiguration = workspace.getConfiguration(SETTING_SECTION_JOB);
        const recentMaxLen: number = settings.get(SETTING_JOB_JOBLIST_RECENTJOBSLENGTH) || 5;
        const recentJobs: string[] = (await getSingleton(ClusterManager)).allRecentJobs[this.index];
        this.recentJobs.children = flatMap(
            recentJobs.slice(0, recentMaxLen),
            name => {
                const foundJob: IPAIJobInfo | undefined = this.jobs.find(job => job.name === name);
                return foundJob ? [JobNode.get(foundJob, this.recentJobs)] : [];
            }
        );
        this.updateAllJobs();

        // If latest submitted job changed, reveal it
        if (this.lastLatestJobName !== recentJobs[0]) {
            const latestJobNode: JobNode | ShowMoreNode = this.recentJobs.children[0];
            if (latestJobNode instanceof JobNode) {
                this.onDidChangeEmitter.fire(latestJobNode);
                this.lastLatestJobName = recentJobs[0];
            }
        }
    }

    public showMore(): void {
        if (this.jobs.length <= this.shownAmount) {
            return;
        }
        const settings: WorkspaceConfiguration = workspace.getConfiguration(SETTING_SECTION_JOB);
        const oldAmount: number = this.shownAmount;
        this.shownAmount += settings.get<number>(SETTING_JOB_JOBLIST_ALLJOBSPAGESIZE) || 20;
        this.updateAllJobs();
        const extendedFirstNode: JobNode | ShowMoreNode = this.allJobs.children[oldAmount - 1];
        if (extendedFirstNode instanceof JobNode) {
            this.onDidChangeEmitter.fire(extendedFirstNode);
        }
    }

    private updateAllJobs(): void {
        this.allJobs.children = this.jobs.slice(0, this.shownAmount).map(
            job => JobNode.get(job, this.allJobs)
        );
        if (this.jobs.length > this.shownAmount) {
            this.allJobs.children.push(new ShowMoreNode(this.allJobs));
        }
        this.onDidChangeEmitter.fire();
    }

    private get recentJobs(): FilterNode {
        return this.children[0];
    }

    private get allJobs(): FilterNode {
        return this.children[1];
    }
}

/**
 * Contributes to the tree view of cluster job list
 */
@injectable()
export class JobListTreeDataProvider extends Singleton implements TreeDataProvider<AnyTreeNode> {
    private onDidChangeTreeDataEmitter: EventEmitter<AnyTreeNode> = new EventEmitter<AnyTreeNode>();
    public onDidChangeTreeData: Event<AnyTreeNode> = this.onDidChangeTreeDataEmitter.event; // tslint:disable-line

    private configurationNodes: ConfigurationNode[] = [];
    private onUpdateDisposables: Disposable[] = [];
    private readonly treeView: TreeView<AnyTreeNode>;
    private refreshTimer: NodeJS.Timer | undefined;

    constructor() {
        super();
        this.treeView = window.createTreeView(VIEW_CONTAINER_JOBLIST, { treeDataProvider: this });
        this.context.subscriptions.push(
            commands.registerCommand(COMMAND_CONTAINER_JOBLIST_REFRESH, () => this.refresh()),
            commands.registerCommand(
                COMMAND_CONTAINER_JOBLIST_MORE,
                (node: ShowMoreNode) => node.parent.parent.showMore()
            ),
            this.treeView
        );
    }

    public async refresh(index: number = -1): Promise<void> {
        const allConfigurations: IPAICluster[] = (await getSingleton(ClusterManager)).allConfigurations;
        if (index === -1 || !this.configurationNodes[index]) {
            this.onUpdateDisposables.forEach(d => d.dispose());
            this.configurationNodes = allConfigurations.map((conf, i) => new ConfigurationNode(conf, i));
            this.onUpdateDisposables = this.configurationNodes.map(
                node => node.onDidChange(
                    latestJob => {
                        if (latestJob) {
                            this.treeView.reveal(latestJob);
                        } else {
                            node.children.forEach(filterNode => this.onDidChangeTreeDataEmitter.fire(filterNode));
                        }
                    }
                )
            );
            this.onDidChangeTreeDataEmitter.fire();
            await this.reloadJobs();
        } else {
            const node: ConfigurationNode = this.configurationNodes[index];
            node.configuration = allConfigurations[index];
            await this.reloadJobs(node);
        }
    }

    public getTreeItem(element: AnyTreeNode): AnyTreeNode {
        return element;
    }

    public getChildren(element?: AnyTreeNode): AnyTreeNode[] | undefined {
        if (!element) {
            // Root nodes: configurations
            return this.configurationNodes;
        }
        return element.children;
    }

    public getParent(element: AnyTreeNode): AnyTreeNode | undefined {
        return element.parent;
    }

    public onActivate(): Promise<void> {
        return this.refresh();
    }

    public async onDeactivate(): Promise<void> {
        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
        }
        this.onUpdateDisposables.forEach(d => d.dispose());
    }

    private async reloadJobs(node?: ConfigurationNode): Promise<void> {
        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
        }
        if (node) {
            await node.loadJobs();
        } else {
            await Promise.all(this.configurationNodes.map(n => n.loadJobs()));
        }
        const settings: WorkspaceConfiguration = workspace.getConfiguration(SETTING_SECTION_JOB);
        const interval: number = settings.get(SETTING_JOB_JOBLIST_REFERSHINTERVAL) || 10;
        this.refreshTimer = setTimeout(this.reloadJobs.bind(this), interval);
    }
}