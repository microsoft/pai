// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import c from 'classnames';
import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  DetailsList,
  DetailsListLayoutMode,
  SelectionMode,
} from 'office-ui-fabric-react';

import t from '../../../components/tachyons.scss';
import CopyButton from '../../../components/copy-button';

const GroupList = ({ groups }) => {
  const groupItems = useMemo(() => {
    return groups;
  }, [groups]);

  const groupColumns = [
    {
      key: 'groupname',
      minWidth: 120,
      maxWidth: 150,
      name: 'Group Name',
      isResizable: true,
      onRender(group) {
        return (
          <div className={c(t.flex, t.itemsCenter, t.h100)}>
            {group.groupname}
          </div>
        );
      },
    },
    {
      key: 'externalname',
      minWidth: 150,
      maxWidth: 150,
      name: 'External Name',
      isResizable: true,
      onRender(group) {
        return (
          <div className={c(t.flex, t.itemsCenter, t.h100)}>
            {group.externalName}
          </div>
        );
      },
    },
    {
      key: 'virtualClusters',
      minWidth: 150,
      maxWidth: 150,
      name: 'Virtual Clusters',
      isResizable: true,
      onRender(group) {
        return (
          <div className={c(t.flex, t.itemsCenter, t.h100)}>
            {group.extension.acls.virtualClusters.join()}
          </div>
        );
      },
    },
    {
      key: 'description',
      minWidth: 150,
      name: 'Description',
      isResizable: true,
      onRender(group) {
        return (
          <div className={c(t.flex, t.itemsCenter, t.h100)}>
            {group.description}
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <DetailsList
        columns={groupColumns}
        disableSelectionZone
        items={groupItems}
        layoutMode={DetailsListLayoutMode.justified}
        selectionMode={SelectionMode.none}
      />
    </div>
  );
};

GroupList.defaultProps = {
  groups: [],
};

GroupList.propTypes = {
  groups: PropTypes.arrayOf(PropTypes.object),
};

export default GroupList;
