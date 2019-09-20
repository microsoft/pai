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

import React, { useContext, useState } from 'react';

import {
  CommandBarButton,
  SearchBox,
  CommandBar,
  ContextualMenuItemType,
  ColorClassNames,
  getTheme,
  TooltipHost,
} from 'office-ui-fabric-react';
import { PropTypes } from 'prop-types';
import { findIndex } from 'lodash';

import Context from './Context';
import Filter from './Filter';

function FilterButton({ defaultRender: Button, ...props }) {
  const {
    subMenuProps: { items },
  } = props;
  const checkedItems = items
    .filter(item => item.checked)
    .map(item => item.text);
  const checkedText =
    checkedItems.length === 0 ? null : checkedItems.length === 1 ? (
      <strong>{checkedItems[0]}</strong>
    ) : (
      <strong>
        {checkedItems[0]}
        {` (+${checkedItems.length - 1})`}
      </strong>
    );
  return <Button {...props}>{checkedText}</Button>;
}

FilterButton.propTypes = {
  defaultRender: PropTypes.elementType.isRequired,
  subMenuProps: PropTypes.object.isRequired,
};

function KeywordSearchBox() {
  const { filter, setFilter } = useContext(Context);
  function onKeywordChange(keyword) {
    const { admins, virtualClusters } = filter;
    setFilter(new Filter(keyword, admins, virtualClusters));
  }

  return (
    <SearchBox
      underlined
      placeholder='Filter by keyword'
      styles={{
        root: {
          width: '220px',
          background: 'transparent',
          alignSelf: 'center',
        },
      }}
      value={filter.keyword}
      onChange={onKeywordChange}
    />
  );
}

function TopBar() {
  const [active, setActive] = useState(true);
  const {
    allVCs,
    refreshAllUsers,
    getSelectedUsers,
    filter,
    setFilter,
    addUser,
    createBulkUsers,
    removeUsers,
    editUser,
    showBatchPasswordEditor,
    showBatchVirtualClustersEditor,
  } = useContext(Context);

  const transparentStyles = { root: { background: 'transparent' } };

  /**
   * @type {import('office-ui-fabric-react').ICommandBarItemProps}
   */
  const btnAddUser = {
    key: 'addUser',
    name: 'Add User',
    buttonStyles: transparentStyles,
    iconProps: {
      iconName: 'Add',
    },
    onClick: addUser,
  };

  /**
   * @type {import('office-ui-fabric-react').ICommandBarItemProps}
   */
  const btnCreateBulkUsers = {
    key: 'createBulkUsers',
    name: 'Create Bulk Users',
    buttonStyles: transparentStyles,
    iconProps: {
      iconName: 'Stack',
    },
    onClick: createBulkUsers,
  };

  /**
   * btn remove
   * @type {import('office-ui-fabric-react').ICommandBarItemProps}
   */
  const btnRemove = {
    key: 'remove',
    name: 'Remove',
    buttonStyles: transparentStyles,
    iconProps: {
      iconName: 'UserRemove',
    },
    onClick: removeUsers,
    onRender(item) {
      return (
        <TooltipHost
          content={item.disabledTip}
          styles={{ root: { display: 'inherit' } }}
        >
          <CommandBarButton
            onClick={item.onClick}
            iconProps={item.iconProps}
            menuIconProps={item.menuIconProps}
            styles={transparentStyles}
            disabled={item.disabled}
          >
            {item.name}
          </CommandBarButton>
        </TooltipHost>
      );
    },
  };

  /**
   * @type {import('office-ui-fabric-react').ICommandBarItemProps}
   */
  const btnEdit = {
    key: 'edit',
    name: 'Edit',
    buttonStyles: transparentStyles,
    iconProps: {
      iconName: 'EditContact',
    },
    onClick: () => {
      editUser(getSelectedUsers()[0]);
    },
  };

  /**
   * @type {import('office-ui-fabric-react').ICommandBarItemProps}
   */
  const btnBatchEditPassword = {
    key: 'batchEditPassword',
    name: 'Batch Edit Passwords',
    buttonStyles: transparentStyles,
    iconProps: {
      iconName: 'EditStyle',
    },
    onClick: showBatchPasswordEditor,
  };

  /**
   * btnBatchEditVirtualClusters
   * @type {import('office-ui-fabric-react').ICommandBarItemProps}
   */
  const btnBatchEditVirtualClusters = {
    key: 'BatchEditVirtualClusters',
    name: 'Batch Edit Virtual Clusters',
    buttonStyles: transparentStyles,
    iconProps: {
      iconName: 'FullWidthEdit',
    },
    onClick: showBatchVirtualClustersEditor,
    onRender(item) {
      return (
        <TooltipHost
          content={item.disabledTip}
          styles={{ root: { display: 'inherit' } }}
        >
          <CommandBarButton
            onClick={item.onClick}
            iconProps={item.iconProps}
            menuIconProps={item.menuIconProps}
            styles={transparentStyles}
            disabled={item.disabled}
          >
            {item.name}
          </CommandBarButton>
        </TooltipHost>
      );
    },
  };

  /**
   * @type {import('office-ui-fabric-react').ICommandBarItemProps}
   */
  const btnRefresh = {
    key: 'refresh',
    name: 'Refresh',
    buttonStyles: transparentStyles,
    iconProps: {
      iconName: 'Refresh',
    },
    onClick: refreshAllUsers,
  };

  /**
   * @type {import('office-ui-fabric-react').ICommandBarItemProps}
   */
  const inputKeyword = {
    key: 'keyword',
    commandBarButtonAs: KeywordSearchBox,
  };

  /**
   * btnFilters
   * @type {import('office-ui-fabric-react').ICommandBarItemProps}
   */
  const btnFilters = {
    key: 'filters',
    name: 'Filters',
    iconProps: { iconName: 'Filter' },
    menuIconProps: { iconName: active ? 'ChevronUp' : 'ChevronDown' },
    onClick() {
      setActive(!active);
    },
    onRender(item) {
      return (
        <CommandBarButton
          onClick={item.onClick}
          iconProps={item.iconProps}
          menuIconProps={item.menuIconProps}
          styles={transparentStyles}
        >
          Filters
        </CommandBarButton>
      );
    },
  };

  /**
   * @type {import('office-ui-fabric-react').ICommandBarItemProps}
   */
  const btnClear = {
    key: 'clear',
    name: 'Clear',
    buttonStyles: { root: { background: 'transparent', height: '100%' } },
    iconOnly: true,
    iconProps: {
      iconName: 'Cancel',
    },
    onClick() {
      setFilter(new Filter());
      setActive(false);
    },
  };

  /**
   * @returns {import('office-ui-fabric-react').ICommandBarItemProps}
   */
  function getBtnAdmin() {
    /**
     * @param {React.SyntheticEvent} event
     * @param {import('office-ui-fabric-react').IContextualMenuItem} item
     */
    function onClick(event, { key, checked }) {
      event.preventDefault();
      const { keyword, virtualClusters } = filter;
      const admins = new Set(filter.admins);
      if (checked) {
        admins.delete(key);
      } else {
        admins.add(key);
      }
      setFilter(new Filter(keyword, admins, virtualClusters));
    }

    /**
     * @param {React.SyntheticEvent} event
     */
    function onClearClick(event) {
      event.preventDefault();
      const { keyword, virtualClusters } = filter;
      setFilter(new Filter(keyword, new Set(), virtualClusters));
    }

    /**
     * @param {string} key
     * @param {string} text
     * @returns {import('office-ui-fabric-react').IContextualMenuItem}
     */
    function getItem(key) {
      return {
        key,
        text: key ? 'Yes' : 'No',
        canCheck: true,
        checked: filter.admins.has(key),
        onClick: onClick,
      };
    }

    return {
      key: 'admin',
      text: 'Admin',
      buttonStyles: transparentStyles,
      iconProps: {
        iconName: 'Admin',
      },
      subMenuProps: {
        items: [true, false].map(getItem).concat([
          {
            key: 'divider',
            itemType: ContextualMenuItemType.Divider,
          },
          {
            key: 'clear',
            text: 'Clear',
            onClick: onClearClick,
          },
        ]),
      },
      commandBarButtonAs: FilterButton,
    };
  }

  /**
   * @returns {import('office-ui-fabric-react').ICommandBarItemProps}
   */
  function getBtnVirtualCluster() {
    /**
     * @param {React.SyntheticEvent} event
     * @param {import('office-ui-fabric-react').IContextualMenuItem} item
     */
    function onClick(event, { key, checked }) {
      event.preventDefault();
      const { keyword, admins } = filter;
      const virtualClusters = new Set(filter.virtualClusters);
      if (checked) {
        virtualClusters.delete(key);
      } else {
        virtualClusters.add(key);
      }
      setFilter(new Filter(keyword, admins, virtualClusters));
    }

    /**
     * @param {React.SyntheticEvent} event
     */
    function onClearClick(event) {
      event.preventDefault();
      const { keyword, admins } = filter;
      setFilter(new Filter(keyword, admins, new Set()));
    }

    /**
     * @param {string} key
     * @param {string} text
     * @returns {import('office-ui-fabric-react').IContextualMenuItem}
     */
    function getItem(key) {
      return {
        key,
        text: key,
        canCheck: true,
        checked: filter.virtualClusters.has(key),
        onClick: onClick,
      };
    }

    return {
      key: 'virtualCluster',
      name: 'Virtual Cluster',
      buttonStyles: transparentStyles,
      iconProps: {
        iconName: 'CellPhone',
      },
      subMenuProps: {
        items: allVCs.map(getItem).concat([
          {
            key: 'divider',
            itemType: ContextualMenuItemType.Divider,
          },
          {
            key: 'clear',
            text: 'Clear',
            onClick: onClearClick,
          },
        ]),
      },
      commandBarButtonAs: FilterButton,
    };
  }

  const topBarItems = [];
  const selectedUsers = getSelectedUsers();
  const selected = selectedUsers.length > 0;
  const selectedMulti = selectedUsers.length > 1;
  const selectedAdmin = findIndex(selectedUsers, user => user.admin) !== -1;
  if (selected) {
    if (selectedMulti) {
      topBarItems.push(btnBatchEditPassword);
      if (selectedAdmin) {
        const disabledTip =
          'Unable to do this for administrators, please make sure the multi-option does not include an administrator';
        topBarItems.push(
          Object.assign(btnBatchEditVirtualClusters, {
            disabled: true,
            disabledTip,
          }),
        );
        topBarItems.push(
          Object.assign(btnRemove, { disabled: true, disabledTip }),
        );
      } else {
        topBarItems.push(btnBatchEditVirtualClusters);
        topBarItems.push(btnRemove);
      }
    } else {
      topBarItems.push(btnEdit);
      if (selectedAdmin) {
        topBarItems.push(
          Object.assign(btnRemove, {
            disabled: true,
            disabledTip: 'The administrator could not be removed',
          }),
        );
      } else {
        topBarItems.push(btnRemove);
      }
    }
  } else {
    topBarItems.push(btnAddUser);
    topBarItems.push(btnCreateBulkUsers);
  }
  topBarItems.push(btnRefresh);
  const topBarFarItems = [btnFilters];

  const filterBarItems = [inputKeyword];
  const filterBarFarItems = [getBtnVirtualCluster(), getBtnAdmin(), btnClear];

  const { spacing } = getTheme();

  return (
    <React.Fragment>
      <CommandBar
        items={topBarItems}
        farItems={topBarFarItems}
        styles={{ root: { backgroundColor: 'transparent', padding: 0 } }}
      />
      {active ? (
        <CommandBar
          items={filterBarItems}
          farItems={filterBarFarItems}
          styles={{
            root: [
              ColorClassNames.neutralLightBackground,
              {
                marginTop: spacing.s2,
                paddingTop: spacing.m,
                paddingBottom: spacing.m,
                height: 'auto',
              },
            ],
          }}
        />
      ) : null}
    </React.Fragment>
  );
}

export default TopBar;
