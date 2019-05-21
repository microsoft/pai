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

import React, {useContext, useState, useEffect} from 'react';

import {CommandBarButton} from 'office-ui-fabric-react/lib/Button';
import {SearchBox} from 'office-ui-fabric-react/lib/SearchBox';
import {CommandBar} from 'office-ui-fabric-react/lib/CommandBar';
import {ContextualMenuItemType} from 'office-ui-fabric-react/lib/ContextualMenu';

import Context from './Context';
import Filter from './Filter';
import {spacing} from '../job-detail/util';
import c from 'classnames';
import t from '../../../../components/tachyons.scss';

import webportalConfig from '../../../../config/webportal.config';
/* eslint-disable react/prop-types */
function FilterButton({defaultRender: Button, ...props}) {
  const {subMenuProps: {items}} = props;
  const checkedItems = items.filter((item) => item.checked).map((item) => item.text);
  const checkedText = checkedItems.length === 0 ? null
    : checkedItems.length === 1 ? <strong>{checkedItems[0]}</strong>
    : <strong>{checkedItems[0]}{` (+${checkedItems.length - 1})`}</strong>;
  return (
    <Button {...props}>
      {checkedText}
    </Button>
  );
}

function KeywordSearchBox() {
  const {filter, setFilter} = useContext(Context);
  function onKeywordChange(keyword) {
    const {users, virtualClusters, statuses} = filter;
    setFilter(new Filter(keyword, users, virtualClusters, statuses));
  }

  /** @type {import('office-ui-fabric-react').IStyle} */
  const rootStyles = {
    backgroundColor: 'transparent', 
    alignSelf: 'center', 
    width: 220,
    padding: 0,
    border: 'none'
  };
  return (
    <SearchBox
      underlined
      placeholder="Filter by keyword"
      styles={{root: rootStyles}}
      value={filter.keyword}
      onChange={onKeywordChange}
    />
  );
}
/* eslint-enable react/prop-types */

function TopBar() {
  const [active, setActive] = useState(true);
  const [users, setUser] = useState(Object.create(null));
  const [virtualClusters, setVirtualClusters] = useState(Object.create(null));

  const statuses = {
    Waiting: true,
    Succeeded: true,
    Running: true,
    Stopped: true,
    Failed: true,
  };

  const {refreshJobs, selectedJobs, stopJob, username, filter, setFilter} = useContext(Context);

  useEffect(() => {
    fetch(`${webportalConfig.restServerUri}/api/v1/user`)
      .then((response) => {
        return response.json();
      }).then((body) => {
        const allUsers = Object.create(null);
        body.forEach((userBody) => {
          allUsers[userBody['username']] = true;
        });
        setUser(allUsers);
      }).catch((err) => {
        alert(err.message);
      });

    fetch(`${webportalConfig.restServerUri}/api/v1/virtual-clusters`)
      .then((response) => {
        return response.json();
      }).then((body) => {
        const allVirtualClusters = Object.create(null);
        for (const virtualCluster of Object.keys(body)) {
          allVirtualClusters[virtualCluster] = true;
        }
        setVirtualClusters(allVirtualClusters);

        const allValidVC = Object.keys(body);
        const {keyword, users, virtualClusters, statuses} = filter;
        const filterVC = new Set(allValidVC.filter((vc) => virtualClusters.has(vc)));
        setFilter(new Filter(keyword, users, filterVC, statuses));
      }).catch((err) => {
        alert(err.message);
      });
  }, []);

  /**
   * @returns {import('office-ui-fabric-react').ICommandBarItemProps}
   */
  function getStop() {
    return {
      key: 'stop',
      name: 'Stop',
      buttonStyles: {root: {
        backgroundColor: 'transparent', 
        height: '100%',
        paddingLeft: spacing.s1,
        paddingRight: spacing.s1,
        marginRight: spacing.s1,
      }},
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
      buttonStyles: {root: {
        backgroundColor: 'transparent', 
        height: '100%',
        paddingLeft: spacing.s1,
        paddingRight: spacing.s1,
        marginRight: spacing.s1
    }},
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
      buttonStyles: {root: {
        backgroundColor: 'transparent', 
        height: '100%',
        paddingLeft: spacing.s1,
        paddingRight: spacing.s1,
      }},
      iconProps: {
        iconName: 'Refresh',
      },
      onClick: refreshJobs,
    };
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
      iconProps: {iconName: 'Filter'},
      menuIconProps: {iconName: active ? 'ChevronUp' : 'ChevronDown'},
      onClick() {
        setActive(!active);
      },
      onRender(item) {
        return (
          <CommandBarButton
            onClick={item.onClick}
            iconProps={item.iconProps}
            menuIconProps={item.menuIconProps}
            styles={{root: {backgroundColor: 'transparent'}}}
          >
            Filter
          </CommandBarButton>
        );
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

    /** @type {import('office-ui-fabric-react').IContextualMenuItem[]} */
    const subMenuItems = [];
    if (username !== undefined) {
      subMenuItems.push({
        key: username,
        text: '@Me',
        canCheck: true,
        checked: filter.users.has(username),
        onClick: onClick,
      });
    }
    subMenuItems.push(...Object.keys(users)
      .filter((user) => user !== username).map(getItem));
    subMenuItems.push({
      key: 'divider',
      itemType: ContextualMenuItemType.Divider,
    }, {
      key: '$clear',
      text: 'Clear',
      onClick: onClearClick,
    });

    return {
      key: 'user',
      text: `User`,
      buttonStyles: {root: {backgroundColor: 'transparent'}},
      iconProps: {
        iconName: 'Contact',
      },
      subMenuProps: {items: subMenuItems},
      commandBarButtonAs: FilterButton,
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
      iconProps: {
        iconName: 'CellPhone',
      },
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
      commandBarButtonAs: FilterButton,
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
      iconProps: {
        iconName: 'Clock',
      },
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
      commandBarButtonAs: FilterButton,
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
        styles={{root: {
          backgroundColor: 'transparent',
          marginTop: spacing.s1,
      }}}
      />
      { active ? <CommandBar
        items={filterBarItems}
        className={c(t.h-100)}
        farItems={filterBarFarItems}
        styles={{root: {
          backgroundColor: '#ECECEC',
          marginBottom: spacing.s1,
          marginTop: spacing.s1,
          paddingTop: spacing.s1,
          paddingBottom: spacing.s1,
        }}}
      /> : null }
    </React.Fragment>
  );
}

export default TopBar;
