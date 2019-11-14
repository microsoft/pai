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

import { isEmpty } from 'lodash';
import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  DetailsList,
  DetailsListLayoutMode,
  SelectionMode,
  FontClassNames,
} from 'office-ui-fabric-react';

function normalizePath(path) {
  if (path.startsWith('/')) {
    path = path.slice(1);
  }
  if (path.endsWith('/')) {
    path = path.slice(0, -1);
  }
  return path;
}

function getStorageServerUri(server) {
  let blobAddress;
  const data = server.data;
  switch (server.type) {
    case 'nfs':
      return `nfs://${data.address}/${normalizePath(data.rootPath)}`;
    case 'samba':
      return `smb://${data.address}/${normalizePath(data.rootPath)}`;
    case 'azurefile':
      return `smb://${data.dataStore}/${normalizePath(data.fileShare)}`;
    case 'azureblob':
      blobAddress =
        data.dataStore || `${data.accountName}.blob.core.windows.net`;
      return `http://${blobAddress}/${normalizePath(data.containerName)}`;
    case 'hdfs':
      return `hdfs://${data.namenode}:${data.port}`;
    default:
      throw new Error('Invalid storage server type');
  }
}

const StorageList = ({ storageConfigs, storageServers }) => {
  const [items, groups] = useMemo(() => {
    const items = [];
    const groups = [];
    let idx = 0;
    for (const config of storageConfigs) {
      if (isEmpty(config.mountInfos)) {
        continue;
      }
      for (const item of config.mountInfos) {
        const server = storageServers.find(x => x.spn === item.server);
        items.push({
          key: `${config.name}:${item.mountPoint}`,
          name: `${config.name}:${item.mountPoint}`,
          mountPoint: item.mountPoint,
          type: server.type,
          serverUri: `${getStorageServerUri(server)}/${normalizePath(
            item.path,
          )}`,
          permission: item.permission,
        });
      }
      groups.push({
        key: config.name,
        name: config.name,
        startIndex: idx,
        count: config.mountInfos.length,
      });
      idx += config.mountInfos.length;
    }
    return [items, groups];
  }, [storageConfigs, storageServers]);

  const columns = [
    {
      key: 'serverUri',
      name: 'Server URI',
      fieldName: 'serverUri',
      isResizable: true,
    },
    {
      key: 'mountPoint',
      name: 'Mount Point',
      fieldName: 'mountPoint',
      isResizable: true,
    },
    { key: 'type', name: 'Server Type', fieldName: 'type', isResizable: true },
    {
      key: 'permission',
      name: 'Permission',
      fieldName: 'permission',
      isResizable: true,
    },
  ];

  return (
    <DetailsList
      items={items}
      groups={groups}
      columns={columns}
      disableSelectionZone
      layoutMode={DetailsListLayoutMode.justified}
      selectionMode={SelectionMode.none}
      groupProps={{
        headerProps: {
          styles: {
            title: [FontClassNames.small],
            expand: [FontClassNames.small],
          },
        },
      }}
    />
  );
};

StorageList.propTypes = {
  storageConfigs: PropTypes.array.isRequired,
  storageServers: PropTypes.array.isRequired,
};

export default StorageList;
