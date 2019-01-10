/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */

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
export const COMMAND_TREEVIEW_OPEN_PORTAL = 'paiext.treeview.openPortal';
export const COMMAND_TREEVIEW_DOUBLECLICK = 'paiext.treeview.doubleclick';
export const COMMAND_SUBMIT_JOB = 'paiext.cluster.job.submit';
export const COMMAND_SIMULATE_JOB = 'paiext.cluster.job.simulate';
export const COMMAND_CREATE_JOB_CONFIG = 'paiext.cluster.job.create-config';

export const VIEW_CONFIGURATION_TREE = 'PAIExplorer';
export const CONTEXT_CONFIGURATION_ITEM = 'PAIConfiguration';
export const CONTEXT_CONFIGURATION_ITEM_WEBPAGE = 'PAIWebpage';

export const SETTING_SECTION_JOB = 'pai.job';
export const SETTING_JOB_UPLOAD_ENABLED = 'upload.enabled';
export const SETTING_JOB_UPLOAD_EXCLUDE = 'upload.exclude';
export const SETTING_JOB_UPLOAD_INCLUDE = 'upload.include';
export const SETTING_JOB_GENERATEJOBNAME_ENABLED = 'generateJobName.enabled';

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

export const OCTICON_CLOUDUPLOAD = '$(cloud-upload)';

export const SCHEMA_JOB_CONFIG = 'pai_job_config.schema.json';
