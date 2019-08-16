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
import {Modal, FontClassNames, DefaultButton, DetailsList, DetailsListLayoutMode, SelectionMode, Stack, StackItem, mergeStyles, getTheme} from 'office-ui-fabric-react';
import PropTypes from 'prop-types';
import c from 'classnames';
import t from '../../../components/tachyons.scss';

export default function TeamDetail({isOpen = false, config, servers=[], hide}) {
  const handleCancel = () => {
    hide();
  };

  const {spacing} = getTheme();
  const usedServers = servers.filter((server) => {
    const mountInfo = config.mountInfos.find((info) => info.server === server.spn);
    return mountInfo !== undefined;
  });

  const columes = [
    {
      key: 'name',
      name: 'Name',
      headerClassName: FontClassNames.medium,
      minWidth: 180,
      onRender: (item, idx) => {
        if (idx === 0) {
          return (
              <div className={FontClassNames.medium}>
                {config.name}
              </div>
            );
        } else {
          return undefined;
        }
      },
    },
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
      key: 'server',
      name: 'Storage Server',
      headerClassName: FontClassNames.medium,
      minWidth: 150,
      onRender: (item) => {
        // const serverInfo = usedServers.find((server) => server.spn === item.server);
        return (
          <div className={FontClassNames.medium}>
            {`${item.server}`}
          </div>
        );
      },
    },
    {
      key: 'serverPath',
      name: 'Server Path',
      headerClassName: FontClassNames.medium,
      minWidth: 100,
      onRender: (item) => {
        return (
          <div className={FontClassNames.medium}>
            {`${item.path}`}
          </div>
        );
      },
    },
    {
      key: 'permission',
      name: 'Permission',
      headerClassName: FontClassNames.medium,
      minWidth: 80,
      // eslint-disable-next-line react/display-name
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
    <Modal
      isOpen={isOpen}
      isBlocking={true}
      containerClassName={mergeStyles({width: '800px', minWidth: '450px'})}
    >
      <div className={c(t.pa4)}>
        <div className={c(FontClassNames.large)}>Team Storage Detail</div>
        <div style={{margin: `${spacing.l1} 0px`}}>
        <div>
            {`This storage is configured for group '${config.gpn}'. 
            You can access this storage because you are a member of the group. 
            For more details, please contact the cluster admin.`}
        </div>
        </div>

        <div className={c(FontClassNames.mediumPlus)}>How to upload data</div>
        <div style={{margin: `${spacing.l1} 0px`}}>
          <div>Please upload data to corresponding path on storage server before use. Different server types require different upload methods.</div>
        </div>
        <div>
        {usedServers.map((server) => {
            return (
            <div key={server.spn}>
                {server.spn}({server.type}): {NAS_TIPS[server.type]}
            </div>
            );
        })}
        </div>

        <div style={{margin: `${spacing.l1}`}}></div>
        <div className={c(FontClassNames.mediumPlus)}>How to use data in your code</div>
        <div style={{margin: `${spacing.l1} 0px`}}>
        <div>
            {`By checking the storage name, the external storage will be automatically mount to the path of your job environment.
            Please treat them as local path.`}
        </div>
        </div>

        <div className={c(FontClassNames.mediumPlus)}>Details</div>
        <DetailsList
          columns={columes}
          disableSelectionZone
          selectionMode={SelectionMode.none}
          items={config.mountInfos}
          layoutMode={DetailsListLayoutMode.fixedColumns}
          compact
        />

        <div style={{marginTop: spacing.l2, marginLeft: 'auto', marginRight: 'auto'}}>
        <Stack horizontal={true} horizontalAlign='center' gap={spacing.s1}>
            <StackItem>
            <DefaultButton onClick={handleCancel}>
            Close
            </DefaultButton>
            </StackItem>
        </Stack>
        </div>
      </div>
    </Modal>
  );
}

TeamDetail.propTypes = {
  isOpen: PropTypes.bool,
  config: PropTypes.object,
  servers: PropTypes.array,
  hide: PropTypes.func,
};


export const NAS_TIPS = {
    nfs: 'To upload data to a NFS server, please mount the path to local path then copy data.',
    samba: 'Use smbclient or cifs to mount remote path to local then upload. If you are using windows, you can access Samba server directly through file explorer.',
    azurefile: 'Use Microsoft Azure Storage Explorer(https://azure.microsoft.com/en-us/features/storage-explorer/) to upload data to AzureFile. Ask cluster admin for access key.',
    azureblog: 'Use Microsoft Azure Storage Explorer(https://azure.microsoft.com/en-us/features/storage-explorer/) to upload data to AzureBlob. Ask cluster admin for access key.',
    hdfs: 'Use fuse to mount HDFS to local then upload. Or use webhdfs to upload data directly.',
  };
