// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import c from 'classnames';
import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  DetailsList,
  DetailsListLayoutMode,
  SelectionMode,
  DefaultButton,
} from 'office-ui-fabric-react';

import t from '../../../components/tachyons.scss';

const GroupList = ({ userInfo, groups }) => {
  const groupItems = useMemo(() => {
    return groups;
  }, [groups]);

  const groupColumns = [
    {
      key: 'status',
      minWidth: 60,
      maxWidth: 80,
      name: 'Status',
      isResizable: true,
      onRender(group) {
        const membership = userInfo.grouplist.includes(group.groupname);
        return (
          <div className={c(t.flex, t.itemsCenter, t.h100)}>
            <DefaultButton
              styles={{
                root: {
                  backgroundColor: membership ? '#5cb85c' : '#d9534f',
                  color: 'white',
                  height: '100%',
                },
              }}
              text={membership ? 'Member' : 'Join'}
              href={membership ? undefined : group.extension.acls.joinUrl}
            />
          </div>
        );
      },
    },
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
  userInfo: {},
  groups: [],
};

GroupList.propTypes = {
  userInfo: PropTypes.object,
  groups: PropTypes.arrayOf(PropTypes.object),
};

export default GroupList;
