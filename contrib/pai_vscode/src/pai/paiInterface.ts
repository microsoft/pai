/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */

export interface IPAICluster {
    name?: string;
    username: string;
    password: string;
    rest_server_uri: string;
    webhdfs_uri?: string;
    grafana_uri?: string;
    hdfs_uri?: string;
    k8s_dashboard_uri?: string;
    web_portal_uri?: string;
}

export interface IPAITaskRole {
    name: string;
    taskNumber: number;
    cpuNumber: number;
    gpuNumber: number;
    memoryMB: number;
    command: string;
}

export interface IPAIJobConfig {
    jobName: string;
    image: string;
    dataDir?: string;
    authFile?: string;
    codeDir: string;
    outputDir: string;
    taskRoles: IPAITaskRole[];
    [key: string]: any;
}

export interface IPAIJobInfo {
    name: string;
    username: string;
    state: 'SUCCEEDED' | 'FAILED' | 'WAITING' | 'STOPPED' | 'RUNNING' | 'UNKNOWN';
    subState: 'FRAMEWORK_COMPLETED' | 'FRAMEWORK_WAITING';
    executionType: 'START' | 'STOP';
    retries: number;
    createdTime: number;
    completedTime: number;
    appExitCode: number;
    virtualCluster: string;
}