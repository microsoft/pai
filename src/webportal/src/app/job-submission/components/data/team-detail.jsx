// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

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
  Text,
  Stack,
  getTheme,
} from 'office-ui-fabric-react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import c from 'classnames';
import t from '../../../components/tachyons.scss';
import { get } from 'lodash';

const { spacing, palette } = getTheme();

const CommandWrapper = styled.div`
  background-color: ${palette.neutralLight};
  padding: ${spacing.m};
`;

export default function TeamDetail({ isOpen = false, config, hide }) {
  const handleCancel = () => {
    hide();
  };

  const columes = config => {
    const result = [
      {
        key: 'containerPath',
        name: 'Path',
        headerClassName: FontClassNames.semibold,
        minWidth: 120,
        onRender: item => {
          return (
            <div className={FontClassNames.small}>{`/mnt/${item.name}`}</div>
          );
        },
      },
      {
        key: 'serverType',
        name: 'Server Type',
        headerClassName: FontClassNames.semibold,
        minWidth: 80,
        onRender: item => {
          if (item === undefined) {
            return (
              <div className={FontClassNames.small}>{'Invalid Server'}</div>
            );
          } else {
            return <div className={FontClassNames.small}>{item.type}</div>;
          }
        },
      },
    ];
    if (config.type === 'dshuttle') {
      result.push({
        key: 'ufsType',
        name: 'UFS Type',
        headerClassName: FontClassNames.semibold,
        minWidth: 80,
        onRender: item => {
          if (item === undefined) {
            return <div className={FontClassNames.small}>{'Invalid Type'}</div>;
          } else if (item.data.ufsType === 'wasb') {
            return 'azureBlob';
          } else {
            return item.data.ufsType;
          }
        },
      });
      result.push({
        key: 'ufsServerPath',
        name: 'UFS Server Path(Server Root Path as bold)',
        headerClassName: FontClassNames.semibold,
        minWidth: 350,
        onRender: item => {
          if (item === undefined) {
            return (
              <div className={FontClassNames.small}>{'Invalid Server'}</div>
            );
          } else {
            return SERVER_PATH[item.type](item);
          }
        },
      });
    } else {
      result.push({
        key: 'serverPath',
        name: 'Server Path(Server Root Path as bold)',
        headerClassName: FontClassNames.semibold,
        minWidth: 400,
        onRender: item => {
          if (item === undefined) {
            return (
              <div className={FontClassNames.small}>{'Invalid Server'}</div>
            );
          } else {
            return SERVER_PATH[item.type](item);
          }
        },
      });
    }
    result.push({
      key: 'permission',
      name: 'Permission',
      headerClassName: FontClassNames.semibold,
      minWidth: 80,
      onRender: item => {
        return (
          <div className={FontClassNames.small}>
            {get(item, 'permission', item.readOnly ? 'ro' : 'rw')}
          </div>
        );
      },
    });

    return result;
  };

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
      <Stack gap='s1'>
        <Text variant='large'>Upload</Text>
        {config.type === 'nfs' && (
          <Stack gap='s2' styles={{ root: { marginLeft: `${spacing.m}` } }}>
            <Text>
              It is recommended to use an ubuntu host to upload data to nfs.
            </Text>
            <CommandWrapper>
              <Text block>
                $ sudo apt-get update && sudo apt-get install -y nfs-common
              </Text>
              <Text block>$ sudo mkdir -p /mnt/nfsData</Text>
              <Text block>
                {`$ sudo mount ${config.data.server}:${config.data.path} /mnt/nfsData`}
              </Text>
              <Text block>
                {'$ cp -r <local_data_dir> /mnt/nfsData/<subPath>'}
              </Text>
            </CommandWrapper>
            <Text>
              If there are errors, contact admin and make sure your host has
              access to nfs server
            </Text>
          </Stack>
        )}
        {config.type !== 'nfs' && (
          <div>
            <div className={c(FontClassNames.small)}>
              Please upload data to corresponding{' '}
              <span style={{ fontWeight: FontWeights.semibold }}>
                UFS Server Path
              </span>{' '}
              before use. Different UFS Type require different upload methods.
            </div>
            <div>
              <div
                key={config.name}
                className={c(FontClassNames.small, t.ml4)}
                style={{ marginTop: '12px' }}
              >
                {NAS_TIPS[config.type]}
              </div>
            </div>
          </div>
        )}
        {config.type === 'nfs' && (
          <Stack gap='s1'>
            <Text variant='large'>Download</Text>
            <Stack gap='s2' styles={{ root: { marginLeft: `${spacing.m}` } }}>
              <CommandWrapper>
                <Text block>$ sudo mkdir -p /mnt/nfsData</Text>
                <Text block>
                  {`$ sudo mount ${config.data.server}:${config.data.path} /mnt/nfsData`}
                </Text>
                <Text block>
                  {'$ cp /mnt/nfsData/<subPath> <local_data_dir>'}
                </Text>
              </CommandWrapper>
            </Stack>
          </Stack>
        )}
        <Text variant='large'>How to use data ?</Text>
        {config.type === 'dshuttle' && (
          <Text styles={{ root: { marginLeft: `${spacing.m}` } }}>
            By selecting team storage, the server path will be automatically
            mounted to path when job running. Please treat is as local folder.
          </Text>
        )}
        {config.type !== 'dshuttle' && (
          <Text styles={{ root: { marginLeft: `${spacing.m}` } }}>
            By selecting team storage, the storage server will be automatically
            mounted to Path when job runs. You could copy/read/write like local
            folder.
          </Text>
        )}
        <Text variant='large'>Details</Text>
        <DetailsList
          columns={columes(config)}
          disableSelectionZone
          selectionMode={SelectionMode.none}
          items={[config]}
          layoutMode={DetailsListLayoutMode.fixedColumns}
          compact
        />
      </Stack>
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
  azureFile: (
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
  azureBlob: (
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
  dshuttle: (
    <div>
      <div style={{ fontWeight: FontWeights.semibold }}>Dshuttle</div>
      <span>
        Storage Dshuttle is configured for group. It used as a fast data cache
        and try to speed up I/O intensive workload. For more detail, please
        refer to
      </span>
      <span> </span>
      <Link
        href='https://github.com/microsoft/dshuttle'
        target='_blank'
        style={{ fontWeight: FontWeights.semibold }}
      >
        Dshuttle doc
      </Link>
      <span> or contact cluster amdin.</span>
    </div>
  ),
};

export const SERVER_PATH = {
  nfs: storage => (
    <div className={FontClassNames.semibold}>
      <b>{`${storage.data.server}:${storage.data.path}`}</b>
      {storage.share === false ? '/$' + '{PAI_USER_NAME}' : '/'}
    </div>
  ),
  samba: storage => (
    <div className={FontClassNames.semibold}>
      <b>{`${storage.data.server}:${storage.data.path}`}</b>
      {storage.share === false ? '/$' + '{PAI_USER_NAME}' : '/'}
    </div>
  ),
  azureFile: storage => (
    <div className={FontClassNames.semibold}>
      <b>{`${storage.data.accountName}.file.core.windows.net/${storage.data.shareName}`}</b>
      {storage.data.path || '/'}
    </div>
  ),
  azureBlob: storage => (
    <div className={FontClassNames.semibold}>
      <b>{`${storage.data.accountName}.blob.core.windows.net/${storage.data.containerName}`}</b>
      {storage.data.path || '/'}
    </div>
  ),
  hdfs: storage => (
    <div className={FontClassNames.semibold}>
      <b>{`${storage.data.namenode}:${storage.data.port}`}</b>
      {storage.data.path || '/'}
    </div>
  ),
  dshuttle: storage => (
    <div className={FontClassNames.semibold}>
      <b>
        {storage.data.ufsType === 'wasb'
          ? `${storage.data.accountName}.blob.core.windows.net/${storage.data.containerName}`
          : storage.data.ufsUri}
      </b>
      {storage.data.path || '/'}
    </div>
  ),
};
