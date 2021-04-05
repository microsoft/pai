// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';
import {
  DetailsList,
  Dialog,
  DetailsListLayoutMode,
  SelectionMode,
} from 'office-ui-fabric-react';
import { Box, Link, Text } from '../../elements';
import styled from 'styled-components';
import theme from '../../theme';

const CommandWrapper = styled('div')({
  backgroundColor: theme.colors['light-gray'],
  padding: theme.space.m,
});

export const TeamDetail = ({ isOpen, config, onDismiss }) => {
  const columns = config => {
    const result = [
      {
        key: 'containerPath',
        name: 'Path',
        minWidth: 120,
        onRender: item => {
          return (
            <Box fontSize='s' fontWeight='bold'>{`/mnt/${item.name}`}</Box>
          );
        },
      },
      {
        key: 'serverType',
        name: 'Server Type',
        minWidth: 80,
        onRender: item => {
          if (item === undefined) {
            return <Box fontSize='s'>{'Invalid Server'}</Box>;
          } else {
            return <Box fontSize='s'>{item.type}</Box>;
          }
        },
      },
    ];
    if (config.type === 'dshuttle') {
      result.push({
        key: 'ufsType',
        name: 'UFS Type',
        minWidth: 80,
        onRender: item => {
          if (item === undefined) {
            return (
              <Box fontSize='s' fontWeight='bold'>
                {'Invalid Type'}
              </Box>
            );
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
        minWidth: 350,
        onRender: item => {
          if (item === undefined) {
            return (
              <Box fontSize='s' fontWeight='bold'>
                {'Invalid Server'}
              </Box>
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
        minWidth: 400,
        onRender: item => {
          if (item === undefined) {
            return (
              <Box fontSize='s' fontWeight='bold'>
                {'Invalid Server'}
              </Box>
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
      minWidth: 80,
      onRender: item => {
        return (
          <Box fontSize='s' fontWeight='bold'>
            {get(item, 'permission', item.readOnly ? 'ro' : 'rw')}
          </Box>
        );
      },
    });

    return result;
  };
  return (
    <Dialog
      hidden={!isOpen}
      onDismiss={onDismiss}
      minWidth={800}
      maxWidth={900}
      modalProps={{
        isBlocking: false,
        styles: { main: { maxWidth: 900 } },
      }}
      dialogContentProps={{
        // type: DialogType.normal,
        styles: {
          title: { padding: '20px 36px 12px 20px' },
          inner: { padding: '0px 40px 20px 20px' },
          topButton: { padding: '20px 20px 0px 0px' },
        },
        title: (
          <Text fontSize='s1' fontWeight='bold'>
            Team Storage Detail
          </Text>
        ),
      }}
    >
      <Box>
        <Text fontSize='s1'>Upload</Text>
        {config.type === 'nfs' ? (
          <Box marginLeft='m' marginTop='s1'>
            <Text>
              It is recommended to use an ubuntu host to upload data to nfs.
            </Text>
            <CommandWrapper>
              <Box>
                $ sudo apt-get update && sudo apt-get install -y nfs-common
              </Box>
              <Box>$ sudo mkdir -p /mnt/nfsData</Box>
              <Box>
                {`$ sudo mount ${config.data.server}:${config.data.path} /mnt/nfsData`}
              </Box>
              <Box>{'$ cp -r <local_data_dir> /mnt/nfsData/<subPath>'}</Box>
            </CommandWrapper>
            <Text>
              If there are errors, contact admin and make sure your host has
              access to nfs server
            </Text>
          </Box>
        ) : (
          <Box>
            <Box fontSize='s1'>
              Please upload data to corresponding{' '}
              <Text fontWeight='bold'>UFS Server Path</Text>
              before use. Different UFS Type require different upload methods.
            </Box>
            <Box marginTop='m' fontSize='s1'>
              {NAS_TIPS[config.type]}
            </Box>
          </Box>
        )}
      </Box>
      {config.type === 'nfs' && (
        <Box>
          <Text fontSize='s1'>Download</Text>
          <Box marginLeft='m' marginTop='s1'>
            <CommandWrapper>
              <Box>$ sudo mkdir -p /mnt/nfsData</Box>
              <Box>
                {`$ sudo mount ${config.data.server}:${config.data.path} /mnt/nfsData`}
              </Box>
              <Box>{'$ cp /mnt/nfsData/<subPath> <local_data_dir>'}</Box>
            </CommandWrapper>
          </Box>
        </Box>
      )}
      <Box>
        <Text fontSize='s1'>How to use data ?</Text>
        {config.type === 'dshuttle' && (
          <Box marginLeft='m' marginTop='s1'>
            By selecting team storage, the server path will be automatically
            mounted to path when job running. Please treat is as local folder.
          </Box>
        )}
        {config.type !== 'dshuttle' && (
          <Box marginLeft='m' marginTop='s1'>
            By selecting team storage, the storage server will be automatically
            mounted to Path when job runs. You could copy/read/write like local
            folder.
          </Box>
        )}
      </Box>
      <Box>
        <Text fontSize='s1'>Details</Text>
        <DetailsList
          columns={columns(config)}
          disableSelectionZone
          selectionMode={SelectionMode.none}
          items={[config]}
          layoutMode={DetailsListLayoutMode.fixedColumns}
          compact
        />
      </Box>
    </Dialog>
  );
};

TeamDetail.propTypes = {
  isOpen: PropTypes.bool,
  config: PropTypes.object,
  onDismiss: PropTypes.func,
};

export const NAS_TIPS = {
  nfs: (
    <div>
      <Box fontWeight='bold'>NFS</Box>
      <div>
        Mount <Text fontWeight='bold'>Server Path</Text> to local then copy
        data. For example:
      </div>
      <Box fontSize='s'>
        <div>apt-get update && apt-get install -y nfs-common</div>
        <div>
          mount -t nfs4 <Text fontWeight='bold'>[Server Path]</Text> /mnt
        </div>
        <div>
          cp <Text fontWeight='bold'>[local data]</Text> /mnt/
        </div>
        <div>umount -l /mnt</div>
      </Box>
    </div>
  ),
  samba: (
    <div>
      <Box fontWeight='bold'>Samba</Box>
      <div>
        Mount <Text fontWeight='bold'>Server Path</Text> to local then copy
        data. For example:
      </div>
      <Box fontSize='s'>
        <div>apt-get update && apt-get install -y cifs-utils</div>
        <div>
          mount -t cifs //
          <Text fontWeight='bold'>[Server Path]</Text> /mnt
        </div>
        <div>
          cp <Text fontWeight='bold'>[local data]</Text> /mnt/
        </div>
        <div>umount -l /mnt</div>
      </Box>
      <div>
        In windows, Samba server can be accessed directly through file explorer.
        Add prefix {'\\\\'} to <Text fontWeight='bold'>Server Path</Text>{' '}
        {'and convert all "/"s to "\\"'} then open in file explorer.
      </div>
    </div>
  ),
  azureFile: (
    <div>
      <Box fontWeight='bold'>AzureFile</Box>
      <span>Download </span>
      <Link
        href='https://azure.microsoft.com/en-us/features/storage-explorer/'
        target='_blank'
        fontWeight='bold'
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
      <Box fontWeight='bold'>AzureBlob</Box>
      <span>Download </span>
      <Link
        href='https://azure.microsoft.com/en-us/features/storage-explorer/'
        target='_blank'
        fontWeight='bold'
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
      <Box fontWeight='bold'>HDFS</Box>
      <span>Use </span>
      <Link
        href='https://github.com/microsoft/hdfs-mount'
        target='_blank'
        fontWeight='bold'
      >
        hdfs-mount
      </Link>
      <span> mount HDFS to local then upload. Or use </span>
      <Link
        href='https://hadoop.apache.org/docs/r1.0.4/webhdfs.html'
        target='_blank'
        fontWeight='bold'
      >
        WebHDFS
      </Link>
      <span> to upload data directly.</span>
    </div>
  ),
  dshuttle: (
    <div>
      <Box fontWeight='bold'>Dshuttle</Box>
      <span>
        Storage Dshuttle is configured for group. It used as a fast data cache
        and try to speed up I/O intensive workload. For more detail, please
        refer to
      </span>
      <span> </span>
      <Link
        href='https://github.com/microsoft/dshuttle'
        target='_blank'
        fontWeight='bold'
      >
        Dshuttle doc
      </Link>
      <span> or contact cluster amdin.</span>
    </div>
  ),
};

export const SERVER_PATH = {
  nfs: storage => (
    <Box fontWeight='bold'>
      <b>{`${storage.data.server}:${storage.data.path}`}</b>
      {storage.share === false ? '/$' + '{PAI_USER_NAME}' : '/'}
    </Box>
  ),
  samba: storage => (
    <Box fontWeight='bold'>
      <b>{`${storage.data.server}:${storage.data.path}`}</b>
      {storage.share === false ? '/$' + '{PAI_USER_NAME}' : '/'}
    </Box>
  ),
  azureFile: storage => (
    <Box fontWeight='bold'>
      <b>{`${storage.data.accountName}.file.core.windows.net/${storage.data.shareName}`}</b>
      {storage.data.path || '/'}
    </Box>
  ),
  azureBlob: storage => (
    <Box fontWeight='bold'>
      <b>{`${storage.data.accountName}.blob.core.windows.net/${storage.data.containerName}`}</b>
      {storage.data.path || '/'}
    </Box>
  ),
  hdfs: storage => (
    <Box fontWeight='bold'>
      <b>{`${storage.data.namenode}:${storage.data.port}`}</b>
      {storage.data.path || '/'}
    </Box>
  ),
  dshuttle: storage => (
    <Box fontWeight='bold'>
      <b>
        {storage.data.ufsType === 'wasb'
          ? `${storage.data.accountName}.blob.core.windows.net/${storage.data.containerName}`
          : storage.data.ufsUri}
      </b>
      {storage.data.path || '/'}
    </Box>
  ),
};
