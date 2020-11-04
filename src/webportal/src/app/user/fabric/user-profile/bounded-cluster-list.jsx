// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import c from 'classnames';
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  DetailsList,
  DetailsListLayoutMode,
  SelectionMode,
  CommandBarButton,
  DialogType,
  Dialog,
  DialogFooter,
  PrimaryButton,
  DefaultButton,
} from 'office-ui-fabric-react';

import t from '../../../components/tachyons.scss';
import CopyButton from '../../../components/copy-button';

const BoundedClusterList = ({ boundedClusters, onDelete }) => {
  const [processing, setProcessing] = useState(false);
  const [deleteClusterAlias, setDeleteClusterAlias] = useState(null);

  const boundedClusterList = [];
  for (const alias in boundedClusters) {
    boundedClusterList.push({
      alias: alias,
      uri: boundedClusters[alias].uri,
      username: boundedClusters[alias].username,
      token: boundedClusters[alias].token,
    });
  }
  // sort by alias
  boundedClusterList.sort((c1, c2) => (c1.alias > c2.alias ? 1 : -1));

  const columns = [
    {
      key: 'token',
      minWidth: 120,
      name: 'Token',
      isResizable: true,
      onRender(clusterConfig) {
        return (
          <div className={c(t.flex, t.itemsCenter, t.h100)}>
            <div className={t.truncate}>{clusterConfig.token}</div>
            <CopyButton value={clusterConfig.token} />
          </div>
        );
      },
    },
    {
      key: 'clusterAlias',
      minWidth: 150,
      maxWidth: 150,
      name: 'Cluster Alias',
      isResizable: true,
      onRender(clusterConfig) {
        return (
          <div className={c(t.flex, t.itemsCenter, t.h100)}>
            {clusterConfig.alias}
          </div>
        );
      },
    },
    {
      key: 'clusterUri',
      minWidth: 150,
      maxWidth: 150,
      name: 'Cluster URI',
      isResizable: true,
      onRender(clusterConfig) {
        return (
          <div className={c(t.flex, t.itemsCenter, t.h100)}>
            {clusterConfig.uri}
          </div>
        );
      },
    },
    {
      key: 'username',
      minWidth: 150,
      name: 'Username',
      isResizable: true,
      onRender(clusterConfig) {
        return (
          <div className={c(t.flex, t.itemsCenter, t.h100)}>
            {clusterConfig.username}
          </div>
        );
      },
    },
    {
      key: 'action',
      minWidth: 100,
      name: 'Action',
      isResizable: true,
      onRender(clusterConfig) {
        return (
          <div className={c(t.flex, t.itemsCenter, t.h100)}>
            <CommandBarButton
              styles={{
                root: { backgroundColor: 'transparent', height: '100%' },
                rootDisabled: { backgroundColor: 'transparent' },
              }}
              iconProps={{ iconName: 'Delete' }}
              text='Delete'
              onClick={() => setDeleteClusterAlias(clusterConfig.alias)}
              disabled={processing}
            />
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <DetailsList
        columns={columns}
        disableSelectionZone
        items={boundedClusterList}
        layoutMode={DetailsListLayoutMode.justified}
        selectionMode={SelectionMode.none}
      />
      <Dialog
        hidden={!deleteClusterAlias}
        onDismiss={() => setDeleteClusterAlias(null)}
        dialogContentProps={{
          type: DialogType.normal,
          title: 'Delete a bounded cluster',
        }}
        modalProps={{
          isBlocking: true,
        }}
        minWidth={400}
      >
        <div>Are you sure you want to delete the selected cluster?</div>
        <DialogFooter>
          <PrimaryButton
            onClick={() => {
              setProcessing(true);
              onDelete(deleteClusterAlias)
                .catch(err => {
                  console.error(err);
                  alert(err.message);
                })
                .finally(() => {
                  setDeleteClusterAlias(null);
                  setProcessing(false);
                });
            }}
            disabled={processing}
            text='Confirm'
          />
          <DefaultButton
            onClick={() => setDeleteClusterAlias(null)}
            disabled={processing}
            text='Cancel'
          />
        </DialogFooter>
      </Dialog>
    </div>
  );
};

BoundedClusterList.propTypes = {
  boundedClusters: PropTypes.object.isRequired,
  onDelete: PropTypes.func.isRequired,
};

export default BoundedClusterList;
