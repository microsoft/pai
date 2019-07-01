/**
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *  @author Microsoft
 */

import * as assert from 'assert';
import { ISuiteCallbackContext } from 'mocha';
import { back as nockBack } from 'nock';
import { join } from 'path';
import { FileType, Uri } from 'vscode';

import { getSingleton, waitForAllSingletonFinish } from '../common/singleton';
import { ClusterManager } from '../pai/clusterManager';
import { HDFSFileSystemProvider } from '../pai/hdfs';

// /out/test/../../src/test/fixures
nockBack.fixtures = join(__dirname, '../../src/test', 'fixtures');
nockBack.setMode('record');

function mockUri(path: string): Uri {
    return Uri.parse('webhdfs://openmindstudio@10.151.40.179' + path);
}

suite('HDFS Client', function (this: ISuiteCallbackContext): void {
    this.timeout(0);

    suiteSetup(async () => {
        await waitForAllSingletonFinish();
        (await getSingleton(ClusterManager)).allConfigurations.push(<any>{
            name: 'Sample Cluster',
            username: 'openmindstudio',
            rest_server_uri: '10.151.40.179/rest-server',
            webhdfs_uri: '10.151.40.179/webhdfs/api/v1',
            grafana_uri: '10.151.40.179/grafana',
            k8s_dashboard_uri: '10.151.40.179/kubernetes-dashboard',
            web_portal_uri: '10.151.40.179/'
        });
    });

    test('File CRUD', async () => {
        const hdfsProvider: HDFSFileSystemProvider = new HDFSFileSystemProvider();
        const { nockDone } = await nockBack('hdfs.filecrud.json');

        await hdfsProvider.writeFile(mockUri('/testfile'), new Buffer('fa'), { create: true, overwrite: false });
        assert.deepEqual(
            (await hdfsProvider.readDirectory(mockUri('/'))).find(file => file[0] === 'testfile'),
            ['testfile', FileType.File],
            'Cannot find created file when listing directory'
        );
        assert.equal(
            (await hdfsProvider.readFile(mockUri('/testfile'))).toString(),
            'fa',
            'File content is different from original'
        );
        await hdfsProvider.delete(mockUri('/testfile'), { recursive: false });
        assert.equal(
            (await hdfsProvider.readDirectory(mockUri('/'))).find(file => file[0] === 'testfile'),
            undefined,
            'Deleted file is still found when listing directory'
        );

        nockDone();
    });

    test('Folder CRUD', async () => {
        const hdfsProvider: HDFSFileSystemProvider = new HDFSFileSystemProvider();
        const { nockDone } = await nockBack('hdfs.foldercrud.json');
        await hdfsProvider.createDirectory(mockUri('/testfolder'));
        assert.deepEqual(
            (await hdfsProvider.readDirectory(mockUri('/'))).find(file => file[0] === 'testfolder'),
            ['testfolder', FileType.Directory],
            'Cannot find created directory when listing directory'
        );
        await hdfsProvider.writeFile(mockUri('/testfolder/testfile'), new Buffer('fa'), { create: true, overwrite: false });
        assert.deepEqual(
            (await hdfsProvider.readDirectory(mockUri('/testfolder'))).find(file => file[0] === 'testfile'),
            ['testfile', FileType.File],
            'Cannot find created file when listing directory'
        );
        assert.equal(
            (await hdfsProvider.readFile(mockUri('/testfolder/testfile'))).toString(),
            'fa',
            'File content is different from original'
        );
        await hdfsProvider.copy(mockUri('/testfolder/testfile'), mockUri('/testfile'), { overwrite: false });
        assert.equal(
            (await hdfsProvider.readFile(mockUri('/testfile'))).toString(),
            'fa',
            'Copied file content is different from original'
        );
        await hdfsProvider.delete(mockUri('/testfolder'), { recursive: true });
        assert.equal(
            (await hdfsProvider.readDirectory(mockUri('/'))).find(file => file[0] === 'testfolder'),
            undefined,
            'Deleted folder is still found when listing directory'
        );
        await hdfsProvider.delete(mockUri('/testfile'), { recursive: false });
        assert.equal(
            (await hdfsProvider.readDirectory(mockUri('/'))).find(file => file[0] === 'testfile'),
            undefined,
            'Deleted file is still found when listing directory'
        );

        nockDone();
    });

    suiteTeardown(async () => {
        (await getSingleton(ClusterManager)).allConfigurations.pop();
    });
});