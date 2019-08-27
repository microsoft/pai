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
import {Dialog, DialogType, FontClassNames, DetailsList, DetailsListLayoutMode, FontWeights, Link, SelectionMode} from 'office-ui-fabric-react';
import PropTypes from 'prop-types';
import c from 'classnames';
import t from '../../../components/tachyons.scss';

export default function TeamDetail({isOpen = false, config, servers=[], hide}) {
  const handleCancel = () => {
    hide();
  };

  const usedServers = servers.filter((server) => {
    const mountInfo = config.mountInfos.find((info) => info.server === server.spn);
    return mountInfo !== undefined;
  });

  const columes = [
    {
      key: 'containerPath',
      name: 'Path',
      headerClassName: FontClassNames.medium,
      minWidth: 120,
      onRender: (item) => {
        return (
          <div className={FontClassNames.medium}>
            {item.mountPoint}
          </div>
        );
      },
    },
    {
        key: 'serverType',
        name: 'Server Type',
        headerClassName: FontClassNames.medium,
        minWidth: 80,
        onRender: (item) => {
          const serverInfo = usedServers.find((server) => server.spn === item.server);
          return (
            <div className={FontClassNames.medium}>
              {`${serverInfo.type}`}
            </div>
          );
        },
    },
    {
      key: 'serverPath',
      name: 'Server Path(Server Root Path as bold)',
      headerClassName: FontClassNames.medium,
      minWidth: 400,
      onRender: (item) => {
        const serverInfo = usedServers.find((server) => server.spn === item.server);
        return SERVER_PATH[serverInfo.type](serverInfo, item);
      },
    },
    {
      key: 'permission',
      name: 'Permission',
      headerClassName: FontClassNames.medium,
      minWidth: 80,
      onRender: (item) => {
        return (
          <div className={FontClassNames.medium}>
            RW
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
        title: (<span className={c(FontClassNames.xLarge)}><b>Team Storage Detail</b></span>),
      }}
      minWidth={900}
      modalProps={{
        isBlocking: false,
        styles: {main: {maxWidth: 900}},
      }}
    >
      <div>
        Team storage <b>{config.name}</b> is configured for group <b>{config.gpn}</b>. For more details, please contact the cluster admin.<br/>
      </div>
      <div className={c(t.pa4)}>
        <div className={c(FontClassNames.xLarge)}><b>How to upload data</b></div>
        <div>
          Please upload data to corresponding <b>server path</b> before use. Different server types require different upload methods.<br/>
        </div>
        <div>
        {usedServers.map((server) => {
            return (
            <div key={server.spn}>
                {NAS_TIPS[server.type]}
            </div>
            );
        })}
        </div>
        <br/>
        <div className={c(FontClassNames.xLarge)}><b>How to use data</b></div>
        <div>
            By selecting team storage, the <b>Server Path</b> will be automatically mounted to <b>Path</b> when job runs.
            Please treat it as local folder.<br/>
        </div>
        <br/>
        <div className={c(FontClassNames.xLarge)}><b>Details</b></div>
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
            <b>NFS</b><br/>
            Mount <b>Server Path</b> to local then copy data. For example:<br/>
            <div className={c(FontClassNames.small)} style={{marginLeft: '24px'}}>
            apt-get update && apt-get install -y nfs-common<br/>
            mount -t nfs4 <b>[Server Path]</b> /mnt<br/>
            cp <b>[local data]</b> /mnt/<br/>
            umount -l /mnt<br/>
            </div>
            <br/>
        </div>
        ),
    samba: (
        <div>
            <b>Samba</b><br/>
            Mount <b>Server Path</b> to local then copy data. For example:<br/>
            <div className={c(FontClassNames.small)} style={{marginLeft: '24px'}}>
            apt-get update && apt-get install -y cifs-utils<br/>
            mount -t cifs //<b>[Server Path]</b> /mnt<br/>
            cp <b>[local data]</b> /mnt/<br/>
            umount -l /mnt<br/>
            </div>
            In windows, Samba server can be accessed directly through file explorer. Add prefix {'\\\\'} to <b>Server Path</b> {'and convert all "/"s to "\\"'} then open in file explorer.<br/>
        </div>
        ),
   azurefile: (
        <div>
            <b>AzureFile</b><br/>
        {'Download '}
        <Link
        href='https://azure.microsoft.com/en-us/features/storage-explorer/'
        target='_blank'
        style={{fontWeight: FontWeights.semibold}}
        >
            {'Microsoft Azure Storage Explorer '}
        </Link>
        to upload data to AzureFile. Use [Server Root Path] and ask cluster admin for golden key to access storage.<br/>
        </div>
        ),
   azureblob: (
        <div>
        <b>AzureBlob</b><br/>
        {'Download '}
        <Link
        href='https://azure.microsoft.com/en-us/features/storage-explorer/'
        target='_blank'
        style={{fontWeight: FontWeights.semibold}}
        >
            {'Microsoft Azure Storage Explorer '}
        </Link>
        to upload data to AzureBlob. Use [Server Root Path] and ask cluster admin for golden key to access storage.<br/>
        </div>
        ),
    hdfs: (
        <div>
        <b>HDFS</b><br/>
            {'Use '}
        <Link
        href='https://github.com/microsoft/hdfs-mount'
        target='_blank'
        style={{fontWeight: FontWeights.semibold}}
        >
            {'hdfs-mount '}
        </Link>
            {'mount HDFS to local then upload. Or use '}
        <Link
        href='https://hadoop.apache.org/docs/r1.0.4/webhdfs.html'
        target='_blank'
        style={{fontWeight: FontWeights.semibold}}
        >
            {'WebHDFS '}
        </Link>
            {'to upload data directly.'}<br/>
        </div>
        ),
  };

export const SERVER_PATH = {
    nfs: (server, mountInfo) => (
        <div className={FontClassNames.medium}>
        <b>{`${server.address}:${server.rootPath}`}</b>{`/${mountInfo.path}`}
        </div>
        ),
    samba: (server, mountInfo) => (
        <div className={FontClassNames.medium}>
        <b>{`${server.address}/${server.rootPath}`}</b>{server.rootPath.length === 0 ? '' : '/' + mountInfo.path}
        </div>
        ),
    azurefile: (server, mountInfo) => (
        <div className={FontClassNames.medium}>
        <b>{`${server.dataStore}/${server.fileShare}`}</b>{`/${mountInfo.path}`}
        </div>
        ),
    azureblob: (server, mountInfo) => (
        <div className={FontClassNames.medium}>
        <b>{`${server.dataStore}/${server.containerName}`}</b>{`/${mountInfo.path}`}
        </div>
        ),
    hdfs: (server, mountInfo) => (
        <div className={FontClassNames.medium}>
        <b>{`${server.namenode}:${server.port}`}</b>{`/${mountInfo.path}`}
        </div>
        ),
};
