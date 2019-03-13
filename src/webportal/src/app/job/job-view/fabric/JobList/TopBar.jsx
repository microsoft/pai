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

import React, {useContext, useMemo, useState} from 'react';

import {SearchBox} from 'office-ui-fabric-react/lib/SearchBox';
import {CommandBar} from 'office-ui-fabric-react/lib/CommandBar';
import {ContextualMenuItemType} from 'office-ui-fabric-react/lib/ContextualMenu';

import Context from './Context';
import Filter from './Filter';
import {getStatusText} from './utils';

function TopBar() {
  const [active, setActive] = useState(false);
  const {allJobs, refreshJobs, selectedJobs, stopJob, filter, setFilter} = useContext(Context);

  const {users, virtualClusters, statuses} = useMemo(() => {
    const users = Object.create(null);
    const virtualClusters = Object.create(null);
    const statuses = Object.create(null);

    if (allJobs !== null) {
      allJobs.forEach(function(job) {
        users[job.username] = true;
        virtualClusters[job.virtualCluster] = true;
        statuses[getStatusText(job)] = true;
      });
    }

    return {users, virtualClusters, statuses};
  }, [allJobs]);

  /**
   * @returns {import('office-ui-fabric-react').ICommandBarItemProps}
   */
  function getStop() {
    return {
      key: 'stop',
      name: 'Stop',
      buttonStyles: {root: {backgroundColor: 'transparent', height: '100%'}},
      iconProps: {
        iconName: 'StopSolid',
      },
      onClick() {
        stopJob(...selectedJobs);
      },
    };
  }

  /**
   * @returns {import('office-ui-fabric-react').ICommandBarItemProps}
   */
  function getNew() {
    return {
      key: 'new',
      name: 'New',
      buttonStyles: {root: {backgroundColor: 'transparent', height: '100%'}},
      iconProps: {
        iconName: 'Add',
      },
      href: '/submit.html',
    };
  }

  /**
   * @returns {import('office-ui-fabric-react').ICommandBarItemProps}
   */
  function getRefresh() {
    return {
      key: 'refresh',
      name: 'Refresh',
      buttonStyles: {root: {backgroundColor: 'transparent', height: '100%'}},
      iconProps: {
        iconName: 'Refresh',
      },
      onClick: refreshJobs,
    };
  }

  function KeywordSearchBox() {
    function onKeywordChange(keyword) {
      const {users, virtualClusters, statuses} = filter;
      setFilter(new Filter(keyword, users, virtualClusters, statuses));
    }

    /** @type {import('office-ui-fabric-react').IStyle} */
    const rootStyles = {backgroundColor: 'transparent', alignSelf: 'center', width: 220};
    return (
      <SearchBox
        underlined
        disableAnimation
        placeholder="Filter by keyword"
        styles={{root: rootStyles}}
        value={filter.keyword}
        onChange={onKeywordChange}
      />
    );
  }

  /**
   * @returns {import('office-ui-fabric-react').ICommandBarItemProps}
   */
  function getKeyword() {
    return {
      key: 'keyword',
      commandBarButtonAs: KeywordSearchBox,
    };
  }

  /**
   * @returns {import('office-ui-fabric-react').ICommandBarItemProps}
   */
  function getFilters() {
    return {
      key: 'filters',
      name: 'Filters',
      buttonStyles: {root: {backgroundColor: 'transparent'}},
      iconProps: {iconName: active ? 'FilterSolid' : 'Filter'},
      onClick() {
        setActive(!active);
      },
    };
  }

  /**
   * @returns {import('office-ui-fabric-react').ICommandBarItemProps}
   */
  function getClear() {
    return {
      key: 'clear',
      name: 'Clear',
      buttonStyles: {root: {backgroundColor: 'transparent', height: '100%'}},
      iconOnly: true,
      iconProps: {
        iconName: 'Cancel',
      },
      onClick() {
        setFilter(new Filter());
        setActive(false);
      },
    };
  }

  /**
   * @returns {import('office-ui-fabric-react').ICommandBarItemProps}
   */
  function getUser() {
    /**
     * @param {React.SyntheticEvent} event
     * @param {import('office-ui-fabric-react').IContextualMenuItem} item
     */
    function onClick(event, {key, checked}) {
      event.preventDefault();
      const {keyword, virtualClusters, statuses} = filter;
      const users = new Set(filter.users);
      if (checked) {
        users.delete(key);
      } else {
        users.add(key);
      }
      setFilter(new Filter(keyword, users, virtualClusters, statuses));
    }

    /**
     * @param {React.SyntheticEvent} event
     */
    function onClearClick(event) {
      event.preventDefault();
      const {keyword, virtualClusters, statuses} = filter;
      setFilter(new Filter(keyword, new Set(), virtualClusters, statuses));
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
        checked: filter.users.has(key),
        onClick: onClick,
      };
    }

    return {
      key: 'user',
      name: 'User',
      buttonStyles: {root: {backgroundColor: 'transparent'}},
      subMenuProps: {
        items: Object.keys(users).map(getItem).concat([{
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
    };
  }

  /**
   * @returns {import('office-ui-fabric-react').ICommandBarItemProps}
   */
  function getVirtualCluster() {
    /**
     * @param {React.SyntheticEvent} event
     * @param {import('office-ui-fabric-react').IContextualMenuItem} item
     */
    function onClick(event, {key, checked}) {
      event.preventDefault();
      const {keyword, users, statuses} = filter;
      const virtualClusters = new Set(filter.virtualClusters);
      if (checked) {
        virtualClusters.delete(key);
      } else {
        virtualClusters.add(key);
      }
      setFilter(new Filter(keyword, users, virtualClusters, statuses));
    }

    /**
     * @param {React.SyntheticEvent} event
     */
    function onClearClick(event) {
      event.preventDefault();
      const {keyword, users, statuses} = filter;
      setFilter(new Filter(keyword, users, new Set(), statuses));
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
      buttonStyles: {root: {backgroundColor: 'transparent'}},
      subMenuProps: {
        items: Object.keys(virtualClusters).map(getItem).concat([{
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
    };
  }

  /**
   * @returns {import('office-ui-fabric-react').ICommandBarItemProps}
   */
  function getStatus() {
    /**
     * @param {React.SyntheticEvent} event
     * @param {import('office-ui-fabric-react').IContextualMenuItem} item
     */
    function onClick(event, {key, checked}) {
      event.preventDefault();
      const {keyword, users, virtualClusters} = filter;
      const statuses = new Set(filter.statuses);
      if (checked) {
        statuses.delete(key);
      } else {
        statuses.add(key);
      }
      setFilter(new Filter(keyword, users, virtualClusters, statuses));
    }

    /**
     * @param {React.SyntheticEvent} event
     */
    function onClearClick(event) {
      event.preventDefault();
      const {keyword, users, virtualClusters} = filter;
      setFilter(new Filter(keyword, users, virtualClusters, new Set()));
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
        checked: filter.statuses.has(key),
        onClick: onClick,
      };
    }

    return {
      key: 'status',
      name: 'Status',
      buttonStyles: {root: {backgroundColor: 'transparent'}},
      subMenuProps: {
        items: Object.keys(statuses).map(getItem).concat([{
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
    };
  }

  const topBarItems = [
    selectedJobs.length ? getStop() : getNew(),
    getRefresh(),
  ];
  const topBarFarItems = [getFilters()];

  const filterBarItems = [getKeyword()];
  const filterBarFarItems = [
    getUser(),
    getVirtualCluster(),
    getStatus(),
    getClear(),
  ];

  return (
    <React.Fragment>
      <CommandBar
        items={topBarItems}
        farItems={topBarFarItems}
        styles={{root: {backgroundColor: 'transparent'}}}
      />
      { active ? <CommandBar
        items={filterBarItems}
        farItems={filterBarFarItems}
        styles={{root: {backgroundColor: 'transparent'}}}
      /> : null }
    </React.Fragment>
  );
}

export default TopBar;
