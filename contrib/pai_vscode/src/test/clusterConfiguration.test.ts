/**
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *  @author Microsoft
 */
// tslint:disable:align
import * as assert from 'assert';

import { getSingleton, waitForAllSingletonFinish } from '../common/singleton';
import { ClusterManager } from '../pai/clusterManager';

async function asyncAssertThrows(fn: (...args: any[]) => Promise<any>, message: string): Promise<void> {
    try {
        await fn();
        assert.fail(message);
    } catch { }
}

async function asyncAssertDoesNotThrow(fn: (...args: any[]) => Promise<any>, message: string): Promise<void> {
    try {
        await fn();
    } catch {
        assert.fail(message);
    }
}

suite('PAI Cluster Configurations', () => {
    test('Configuration Validation', async () => {
        await waitForAllSingletonFinish();
        const clusterManager: ClusterManager = await getSingleton(ClusterManager);
        clusterManager.allConfigurations[0] = <any>{};
        await asyncAssertThrows(async () => {
            await clusterManager.validateConfiguration();
        }, 'Invalid configuration should not pass validation');
        clusterManager.allConfigurations[0] = <any>null;
        await asyncAssertThrows(async () => {
            await clusterManager.validateConfiguration();
        }, 'Null configuration should not pass validation');
        clusterManager.allConfigurations[0] = {
            username: 'openmindstudio',
            password: 'Passq1w2e3r4',
            rest_server_uri: '10.151.40.234:9186',
            webhdfs_uri: '10.151.40.234:50070/webhdfs/v1',
            grafana_uri: '10.151.40.234:3000',
            k8s_dashboard_uri: '10.151.40.234:9090'
        };
        await asyncAssertDoesNotThrow(async () => {
            await clusterManager.validateConfiguration();
        }, 'Valid configuration should not trigger error');
    });
});