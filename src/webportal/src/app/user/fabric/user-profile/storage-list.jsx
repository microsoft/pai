// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

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

function getStorageServerUri(storageDetail) {
  const data = storageDetail.data;
  switch (storageDetail.type) {
    case 'nfs':
      return `nfs://${data.server}/${normalizePath(data.path)}`;
    case 'samba':
      return `smb://${data.server}/${normalizePath(data.path)}`;
    case 'azureFile':
      return (
        <>
          <b>{'StorageAccount: '}</b>
          {data.accountName}; <b>{'FileShare: '}</b>
          {data.shareName}; <b>{'Path: '}</b>
        </>
      );
    case 'azureBlob':
      return (
        <>
          <b>{'StorageAccount: '}</b>
          {data.accountName}; <b>{'Container: '}</b>
          {data.containerName}; <b>{'Path: '}</b>
        </>
      );
    case 'hdfs':
      return `hdfs://${data.namenode}:${data.port}`;
    case 'unknown':
      return (
        <>
          <b>{'Unknown'}</b>
        </>
      );
    default:
      throw new Error('Invalid storage server type');
  }
}

const StorageList = ({ storageDetails }) => {
  const [items, groups] = useMemo(() => {
    const items = [];
    const groups = [];
    for (const [idx, storage] of storageDetails.entries()) {
      const mountPoint = `/mnt/${storage.name}`;
      items.push({
        key: `${storage.name}:${mountPoint}`,
        name: `${storage.name}:${mountPoint}`,
        mountPoint: mountPoint,
        type: storage.type,
        serverUri: getStorageServerUri(storage),
        permission: storage.readOnly ? 'ro' : 'rw',
        path: storage.share === false ? '$' + '{PAI_USER_NAME}' : '',
      });

      groups.push({
        key: storage.name,
        name: storage.name,
        startIndex: idx,
        count: 1,
      });
    }
    return [items, groups];
  }, storageDetails);

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
  storageDetails: PropTypes.array.isRequired,
};

export default StorageList;
