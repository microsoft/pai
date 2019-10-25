// Copyright (c) Microsoft Corporation
// All rights reserved.
//
// MIT License
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
// documentation files (the "Software"), to deal in the Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
// to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
// BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

import React from 'react';
import {
  Dialog,
  DialogType,
  FontClassNames,
  FontSizes,
  DetailsList,
  DetailsListLayoutMode,
  FontWeights,
  Link,
  SelectionMode,
} from 'office-ui-fabric-react';
import PropTypes from 'prop-types';
import c from 'classnames';
import t from '../../../components/tachyons.scss';
import { get } from 'lodash';
export default function TeamDetail({
  isOpen = false,
  config,
  servers = [],
  hide,
}) {
  const handleCancel = () => {
    hide();
  };

  const usedServers = servers.filter(server => {
    const mountInfo = config.mountInfos.find(
      info => info.server === server.spn,
    );
    return mountInfo !== undefined;
  });

  const columes = [
    {
      key: 'containerPath',
      name: 'Path',
      headerClassName: FontClassNames.semibold,
      minWidth: 120,
      onRender: item => {
        return <div className={FontClassNames.small}>{item.mountPoint}</div>;
      },
    },
    {
      key: 'serverType',
      name: 'Server Type',
      headerClassName: FontClassNames.semibold,
      minWidth: 80,
      onRender: item => {
        const serverInfo = usedServers.find(
          server => server.spn === item.server,
        );
        if (serverInfo === undefined) {
          return <div className={FontClassNames.small}>{'Invalid Server'}</div>;
        } else {
          return <div className={FontClassNames.small}>{serverInfo.type}</div>;
        }
      },
    },
    {
      key: 'serverPath',
      name: 'Server Path(Server Root Path as bold)',
      headerClassName: FontClassNames.semibold,
      minWidth: 400,
      onRender: item => {
        const serverInfo = usedServers.find(
          server => server.spn === item.server,
        );
        if (serverInfo === undefined) {
          return <div className={FontClassNames.small}>{'Invalid Server'}</div>;
        } else {
          return SERVER_PATH[serverInfo.type](serverInfo, item);
        }
      },
    },
    {
      key: 'permission',
      name: 'Permission',
      headerClassName: FontClassNames.semibold,
      minWidth: 80,
      onRender: item => {
        return (
          <div className={FontClassNames.small}>
            {get(item, 'permission', 'rw')}
          </div>
        );
      },
    },
  ];

  return (
    <Dialog
      hidden={!isOpen}
      onDismiss={handleCancel}
      dialogContentProps={{
        type: DialogType.normal,
        styles: {
          title: { padding: '20px 36px 12px 20px' },
          inner: { padding: '0px 40px 20px 20px' },
          topButton: { padding: '20px 20px 0px 0px' },
        },
        title: (
          <span
            className={c(t.mb2, t.fw6, FontClassNames.semibold)}
            style={{ fontSize: FontSizes.icon }}
          >
            Team Storage Detail
          </span>
        ),
      }}
      minWidth={800}
      maxWidth={900}
      modalProps={{
        isBlocking: false,
        styles: { main: { maxWidth: 900 } },
      }}
    >
      <div className={c(FontClassNames.small)}>
        Team storage{' '}
        <span style={{ fontWeight: FontWeights.semibold }}>{config.name}</span>{' '}
        is configured for group{' '}
        <span style={{ fontWeight: FontWeights.semibold }}>{config.gpn}</span>.
        For more details, please contact the cluster admin.
      </div>
      <div>
        <div
          className={c(t.mt5)}
          style={{
            fontSize: FontSizes.small,
            marginBottom: '12px',
            fontWeight: FontWeights.bold,
          }}
        >
          How to upload data ?
        </div>
        <div className={c(FontClassNames.small)}>
          Please upload data to corresponding{' '}
          <span style={{ fontWeight: FontWeights.semibold }}>server path</span>{' '}
          before use. Different server types require different upload methods.
        </div>
        <div>
          {usedServers.map(server => {
            return (
              <div
                key={server.spn}
                className={c(FontClassNames.small, t.ml4)}
                style={{ marginTop: '12px' }}
              >
                {NAS_TIPS[server.type]}
              </div>
            );
          })}
        </div>
        <div
          className={c(t.mt5)}
          style={{
            fontSize: FontSizes.small,
            fontWeight: FontWeights.bold,
            marginBottom: '12px',
          }}
        >
          How to use data ?
        </div>
        <div className={c(FontClassNames.small)}>
          By selecting team storage, the{' '}
          <span style={{ fontWeight: FontWeights.semibold }}>Server Path</span>{' '}
          will be automatically mounted to{' '}
          <span style={{ fontWeight: FontWeights.semibold }}>Path</span> when
          job runs. Please treat it as local folder.
        </div>
        <div
          className={c(t.mt5)}
          style={{ fontSize: FontSizes.small, fontWeight: FontWeights.bold }}
        >
          Details
        </div>
        <DetailsList
          columns={columes}
          disableSelectionZone
          selectionMode={SelectionMode.none}
          items={config.mountInfos}
          layoutMode={DetailsListLayoutMode.fixedColumns}
          compact
        />
      </div>
    </Dialog>
  );
}

TeamDetail.propTypes = {
  isOpen: PropTypes.bool,
  config: PropTypes.object,
  servers: PropTypes.array,
  hide: PropTypes.func,
};

export const NAS_TIPS = {
  nfs: (
    <div>
      <div style={{ fontWeight: FontWeights.semibold }}>NFS</div>
      <div>
        Mount{' '}
        <span style={{ fontWeight: FontWeights.semibold }}>Server Path</span> to
        local then copy data. For example:
      </div>
      <div className={c(FontClassNames.small)}>
        <div>apt-get update && apt-get install -y nfs-common</div>
        <div>
          mount -t nfs4{' '}
          <span style={{ fontWeight: FontWeights.semibold }}>
            [Server Path]
          </span>{' '}
          /mnt
        </div>
        <div>
          cp{' '}
          <span style={{ fontWeight: FontWeights.semibold }}>[local data]</span>{' '}
          /mnt/
        </div>
        <div>umount -l /mnt</div>
      </div>
    </div>
  ),
  samba: (
    <div>
      <div style={{ fontWeight: FontWeights.semibold }}>Samba</div>
      <div>
        Mount{' '}
        <span style={{ fontWeight: FontWeights.semibold }}>Server Path</span> to
        local then copy data. For example:
      </div>
      <div className={c(FontClassNames.small)}>
        <div>apt-get update && apt-get install -y cifs-utils</div>
        <div>
          mount -t cifs //
          <span style={{ fontWeight: FontWeights.semibold }}>
            [Server Path]
          </span>{' '}
          /mnt
        </div>
        <div>
          cp{' '}
          <span style={{ fontWeight: FontWeights.semibold }}>[local data]</span>{' '}
          /mnt/
        </div>
        <div>umount -l /mnt</div>
      </div>
      <div>
        In windows, Samba server can be accessed directly through file explorer.
        Add prefix {'\\\\'} to{' '}
        <span style={{ fontWeight: FontWeights.semibold }}>Server Path</span>{' '}
        {'and convert all "/"s to "\\"'} then open in file explorer.
      </div>
    </div>
  ),
  azurefile: (
    <div>
      <div style={{ fontWeight: FontWeights.semibold }}>AzureFile</div>
      <span>Download </span>
      <Link
        href='https://azure.microsoft.com/en-us/features/storage-explorer/'
        target='_blank'
        style={{ fontWeight: FontWeights.semibold }}
      >
        Microsoft Azure Storage Explorer
      </Link>
      <span>
        {' '}
        to upload data to AzureFile. Use [Server Root Path] and ask cluster
        admin for golden key to access storage.
      </span>
    </div>
  ),
  azureblob: (
    <div>
      <div style={{ fontWeight: FontWeights.semibold }}>AzureBlob</div>
      <span>Download </span>
      <Link
        href='https://azure.microsoft.com/en-us/features/storage-explorer/'
        target='_blank'
        style={{ fontWeight: FontWeights.semibold }}
      >
        Microsoft Azure Storage Explorer
      </Link>
      <span>
        {' '}
        to upload data to AzureBlob. Use [Server Root Path] and ask cluster
        admin for golden key to access storage.
      </span>
    </div>
  ),
  hdfs: (
    <div>
      <div style={{ fontWeight: FontWeights.semibold }}>HDFS</div>
      <span>Use </span>
      <Link
        href='https://github.com/microsoft/hdfs-mount'
        target='_blank'
        style={{ fontWeight: FontWeights.semibold }}
      >
        hdfs-mount
      </Link>
      <span> mount HDFS to local then upload. Or use </span>
      <Link
        href='https://hadoop.apache.org/docs/r1.0.4/webhdfs.html'
        target='_blank'
        style={{ fontWeight: FontWeights.semibold }}
      >
        WebHDFS
      </Link>
      <span> to upload data directly.</span>
    </div>
  ),
};

export const SERVER_PATH = {
  nfs: (server, mountInfo) => (
    <div className={FontClassNames.semibold}>
      <b>{`${server.address}:${server.rootPath}`}</b>
      {`/${mountInfo.path}`}
    </div>
  ),
  samba: (server, mountInfo) => (
    <div className={FontClassNames.semibold}>
      <b>{`${server.address}/${server.rootPath}`}</b>
      {server.rootPath.length === 0 ? '' : '/' + mountInfo.path}
    </div>
  ),
  azurefile: (server, mountInfo) => (
    <div className={FontClassNames.semibold}>
      <b>{`${server.dataStore}/${server.fileShare}`}</b>
      {`/${mountInfo.path}`}
    </div>
  ),
  azureblob: (server, mountInfo) => (
    <div className={FontClassNames.semibold}>
      <b>{`${server.dataStore}/${server.containerName}`}</b>
      {`/${mountInfo.path}`}
    </div>
  ),
  hdfs: (server, mountInfo) => (
    <div className={FontClassNames.semibold}>
      <b>{`${server.namenode}:${server.port}`}</b>
      {`/${mountInfo.path}`}
    </div>
  ),
};
