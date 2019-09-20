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

import React, { useContext, useMemo } from 'react';

import {
  ShimmeredDetailsList,
  Selection,
  FontClassNames,
  ColumnActionsMode,
  DefaultButton,
  mergeStyles,
  TooltipHost,
} from 'office-ui-fabric-react';

import c from 'classnames';
import t from '../../../components/tachyons.scss';

import { getVirtualCluster } from './utils';

import Context from './Context';
import Ordering from './Ordering';

export default function Table() {
  const {
    allUsers,
    filteredUsers,
    filter,
    ordering,
    setOrdering,
    pagination,
    setSelectedUsers,
    setAllSelected,
    editUser,
    getSelectedUsers,
  } = useContext(Context);
  /**
   * @type {import('office-ui-fabric-react').Selection}
   */
  const selection = useMemo(() => {
    return new Selection({
      onSelectionChanged() {
        setSelectedUsers(selection.getSelection());
        setAllSelected(selection.isAllSelected());
      },
    });
  }, []);

  /**
   * @param {React.MouseEvent<HTMLElement>} event
   * @param {import('office-ui-fabric-react').IColumn} column
   */
  function onColumnClick(event, column) {
    const { field, descending } = ordering;
    if (field === column.key) {
      if (descending) {
        setOrdering(new Ordering());
      } else {
        setOrdering(new Ordering(field, true));
      }
    } else {
      setOrdering(new Ordering(column.key));
    }
  }

  /**
   * @param {import('office-ui-fabric-react').IColumn} column
   */
  function applySortProps(column) {
    column.isSorted = ordering.field === column.key;
    column.isSortedDescending = ordering.descending;
    column.onColumnClick = onColumnClick;
    return column;
  }

  /**
   * @type {import('office-ui-fabric-react').IColumn}
   */
  const usernameColumn = applySortProps({
    key: 'username',
    minWidth: 200,
    name: 'User Name',
    fieldName: 'username',
    className: FontClassNames.mediumPlus,
    headerClassName: FontClassNames.medium,
    isResizable: true,
    isFiltered: filter.keyword !== '',
  });

  const adminColumn = applySortProps({
    key: 'admin',
    minWidth: 60,
    name: 'Admin',
    className: FontClassNames.mediumPlus,
    headerClassName: FontClassNames.medium,
    isResizable: true,
    isFiltered: filter.admins.size > 0,
    onRender(user) {
      return user.admin ? 'Yes' : 'No';
    },
  });

  const emailColumn = applySortProps({
    key: 'email',
    minWidth: 200,
    fieldName: 'email',
    name: 'Email',
    className: FontClassNames.mediumPlus,
    headerClassName: FontClassNames.medium,
    isResizable: true,
  });

  const virtualClusterColumn = applySortProps({
    key: 'virtualCluster',
    minWidth: 250,
    name: 'Virtual Cluster',
    className: FontClassNames.mediumPlus,
    headerClassName: FontClassNames.medium,
    isResizable: true,
    isFiltered: filter.virtualClusters.size > 0,
    onRender(user) {
      return getVirtualCluster(user);
    },
  });

  /**
   * actions column
   * @type {import('office-ui-fabric-react').IColumn}
   */
  const actionsColumn = {
    key: 'actions',
    minWidth: 100,
    name: 'Actions',
    headerClassName: FontClassNames.medium,
    columnActionsMode: ColumnActionsMode.disabled,
    className: mergeStyles({
      paddingTop: '0px !important',
      paddingBottom: '0px !important',
      display: 'flex !important',
    }),
    onRender(user) {
      /**
       * @param {React.MouseEvent} event
       */
      function onClick(event) {
        event.stopPropagation();
        editUser(user);
      }

      const disabled = getSelectedUsers().length > 1;
      const disabledTip = disabled
        ? 'Multi-user simultaneous editing is not supported'
        : '';

      return (
        <div className={c([t.itemsCenter, t.flex])} data-selection-disabled>
          <TooltipHost content={disabledTip}>
            <DefaultButton
              disabled={disabled}
              onClick={onClick}
              styles={{
                root: { backgroundColor: '#e5e5e5' },
                rootFocused: { backgroundColor: '#e5e5e5' },
                rootDisabled: { backgroundColor: '#eeeeee' },
                rootCheckedDisabled: { backgroundColor: '#eeeeee' },
              }}
            >
              Edit
            </DefaultButton>
          </TooltipHost>
        </div>
      );
    },
  };

  const columns = [
    usernameColumn,
    adminColumn,
    emailColumn,
    virtualClusterColumn,
    actionsColumn,
  ];

  return (
    <ShimmeredDetailsList
      items={pagination.apply(ordering.apply(filteredUsers || []))}
      setKey='key'
      columns={columns}
      enableShimmer={allUsers === null || allUsers.length === 0}
      shimmerLines={pagination.itemsPerPage}
      selection={selection}
    />
  );
}
