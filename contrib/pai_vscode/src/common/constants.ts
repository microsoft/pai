/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */

import * as path from 'path';

/* tslint:disable:typedef */
export const COMMAND_ADD_CLUSTER = 'paiext.cluster.add';
export const COMMAND_EDIT_CLUSTER = 'paiext.cluster.edit';
export const COMMAND_DELETE_CLUSTER = 'paiext.cluster.delete';
export const COMMAND_REFRESH_CLUSTER = 'paiext.cluster.refresh';
export const COMMAND_OPEN_HDFS = 'paiext.hdfs.open';
export const COMMAND_HDFS_UPLOAD_FILES = 'paiext.hdfs.upload.files';
export const COMMAND_HDFS_UPLOAD_FOLDERS = 'paiext.hdfs.upload.folders';
export const COMMAND_HDFS_DOWNLOAD = 'paiext.hdfs.download';
export const COMMAND_OPEN_DASHBOARD = 'paiext.cluster.dashboard.open';
export const COMMAND_LIST_JOB = 'paiext.cluster.job.list';
export const COMMAND_VIEW_JOB = 'paiext.cluster.job.view';
export const COMMAND_TREEVIEW_OPEN_PORTAL = 'paiext.treeview.openPortal';
export const COMMAND_TREEVIEW_DOUBLECLICK = 'paiext.treeview.doubleclick';
export const COMMAND_SUBMIT_JOB = 'paiext.cluster.job.submit';
export const COMMAND_SIMULATE_JOB = 'paiext.cluster.job.simulate';
export const COMMAND_CREATE_JOB_CONFIG = 'paiext.cluster.job.create-config';
export const COMMAND_CREATE_JOB_CONFIG_V1 = 'paiext.cluster.job.create-config-v1';
export const COMMAND_CREATE_JOB_CONFIG_V2 = 'paiext.cluster.job.create-config-v2';
export const COMMAND_CONTAINER_HDFS_BACK = 'paiext.container.hdfs.back';
export const COMMAND_CONTAINER_HDFS_REFRESH = 'paiext.container.hdfs.refresh';
export const COMMAND_CONTAINER_HDFS_DELETE = 'paiext.container.hdfs.delete';
export const COMMAND_CONTAINER_HDFS_MKDIR = 'paiext.container.hdfs.mkdir';
export const COMMAND_CONTAINER_JOBLIST_REFRESH = 'paiext.container.joblist.refresh';
export const COMMAND_CONTAINER_JOBLIST_MORE = 'paiext.container.joblist.more';

export const VIEW_CONFIGURATION_TREE = 'PAIExplorer';
export const CONTEXT_CONFIGURATION_ITEM = 'PAIConfiguration';

export const VIEW_CONTAINER_HDFS = 'PAIContainerHDFS';
export const CONTEXT_HDFS_FILE = 'PAIHdfsFile';
export const CONTEXT_HDFS_FOLDER = 'PAIHdfsFolder';
export const CONTEXT_HDFS_ROOT = 'PAIHdfsRoot';
export const CONTEXT_HDFS_SELECT_CLUSTER_ROOT = 'PAIHdfsSelectRoot';
export const CONTEXT_HDFS_SELECT_CLUSTER = 'PAIHdfsSelect';

export const VIEW_CONTAINER_JOBLIST = 'PAIContainerJobList';
export const CONTEXT_JOBLIST_CLUSTER = 'PAIJobListCluster';

export const SETTING_SECTION_HDFS = 'pai.hdfs';
export const SETTING_HDFS_EXPLORER_LOCATION = 'location';
export const ENUM_HDFS_EXPLORER_LOCATION = {
    sidebar: 'sidebar',
    explorer: 'explorer'
};
export const SETTING_SECTION_JOB = 'pai.job';
export const SETTING_JOB_UPLOAD_ENABLED = 'upload.enabled';
export const SETTING_JOB_UPLOAD_EXCLUDE = 'upload.exclude';
export const SETTING_JOB_UPLOAD_INCLUDE = 'upload.include';
export const SETTING_JOB_GENERATEJOBNAME_ENABLED = 'generateJobName.enabled';
export const SETTING_JOB_JOBLIST_RECENTJOBSLENGTH = 'jobList.recentJobsLength';
export const SETTING_JOB_JOBLIST_ALLJOBSPAGESIZE = 'jobList.allJobsPageSize';
export const SETTING_JOB_JOBLIST_REFERSHINTERVAL = 'jobList.refreshInterval';

export const ICON_PAI = {
    light: 'icons/PAI_light.png',
    dark: 'icons/PAI_dark.png'
};
export const ICON_EDIT = 'icons/config.svg';
export const ICON_HDFS = {
    light: 'icons/connected_light.svg',
    dark: 'icons/connected_dark.svg'
};
export const ICON_DASHBOARD = {
    light: 'icons/compute_target_light.svg',
    dark: 'icons/compute_target_dark.svg'
};
export const ICON_LIST_JOB = {
    light: 'icons/run_history_light.svg',
    dark: 'icons/run_history_dark.svg'
};
export const ICON_SUBMIT_JOB = 'icons/deployment.svg';
export const ICON_SIMULATE_JOB = {
    light: 'icons/octicon/terminal.svg',
    dark: 'icons/octicon/terminal_dark.svg'
};
export const ICON_CREATE_CONFIG = {
    light: 'icons/octicon/file.svg',
    dark: 'icons/octicon/file_dark.svg'
};
export const ICON_QUEUE = 'icons/queue.svg';
export const ICON_STOP = 'icons/stop.svg';
export const ICON_ERROR = 'icons/error.svg';
export const ICON_RUN = 'icons/run.svg';
export const ICON_OK = 'icons/ok.svg';
export const ICON_HISTORY = 'icons/history.svg';
export const ICON_LATEST = 'icons/latest.svg';
export const ICON_ELLIPSIS = 'icons/ellipsis.svg';
export const ICON_LOADING = {
    light: 'icons/loading.svg',
    dark: 'icons/loading_dark.svg'
};

export const OCTICON_CLOUDUPLOAD = '$(cloud-upload)';

export const SCHEMA_JOB_CONFIG = 'pai_job_config.schema.json';
export const SCHEMA_YAML_JOB_CONFIG = 'pai_yaml_job_config.schema.json';
export const SCHEMA_YAML_JOB_CONFIG_PATH = path.join(__dirname, `../../schemas/${SCHEMA_YAML_JOB_CONFIG}`);

export const YAML_EXTENSION_ID = 'redhat.vscode-yaml';
export const OPENPAI_SCHEMA = 'openpai';
export const OPENPAI_YAML_SCHEMA_PREFIX = OPENPAI_SCHEMA + '://schema/';
