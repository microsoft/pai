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
import c from 'classnames'
import t from 'tachyons-sass/tachyons.scss';
import $ from 'jquery';

import {getTheme, ColorClassNames} from '@uifabric/styling';
import {CommandBarButton} from 'office-ui-fabric-react/lib/Button';
import {SearchBox} from 'office-ui-fabric-react/lib/SearchBox';
import {CommandBar} from 'office-ui-fabric-react/lib/CommandBar';
import {ContextualMenuItemType, getSubmenuItems} from 'office-ui-fabric-react/lib/ContextualMenu';

import Context from './Context';
import Filter from './Filter';
import {isEmpty} from 'lodash';

import {getSubClusters, getVirtualCluster2Subclusters} from '../../../../home/home/util';
import {listAggregatedVirtualClusters} from '../../../../home/home/conn';
import {defaultRestServerClient} from '../../../../common/http-client';


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
    setFilter(new Filter(keyword.trim(), users, virtualClusters, statuses));
  }

  /** @type {import('office-ui-fabric-react').IStyle} */
  const rootStyles = {backgroundColor: 'transparent', alignSelf: 'center', width: 220};
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
  const [subClustersList, setSubClustersList]= useState('');
  const [searchKey, setSearchKey] = useState();
  const [schedulerVirtualClusters, setSchedulerVirtualClusters]= useState({});
  const [aggregatedVirtualClusters, setAggregatedVirtualClusters]= useState({});

  const statuses = {
    Waiting: true,
    Preparing: true,
    Running: true,
    Finishing: true,
    Succeeded: true,
    Stopping: true,
    Stopped: true,
    Failed: true,
    Unknown: true,
    Archived: true,   
  };

  const jobType = {
    LAUNCHER: true,
    SPARK: true,
    'LIVY-SESSION': true,
    'LIVY-BATCH': true,
    JOBWRAPPER: true,
  };

  const {refreshJobs, selectedJobs, stopJob, username, filter, setFilter} = useContext(Context);

  useEffect(() => {
    defaultRestServerClient.get('/api/v2/user').then((response) => {
      const users = response.data;
      const allUsers = {};
      for (let user of users) {
        allUsers[user.username] = true;
      }
      setUser(allUsers);
    }).catch((err) => {
      if (err.response) {
        alert(err.response.data.message);
      } else {
        alert(err.message);
      }
    });

    Promise.all([
      listAggregatedVirtualClusters().then((response) => {
        const allVirtualClusters = {};
        let virtualCluster2Subclusters = {};
        if (response) {
          virtualCluster2Subclusters = getVirtualCluster2Subclusters(response, getSubClusters());
          for (const virtualCluster of Object.keys(virtualCluster2Subclusters)) {
            allVirtualClusters[virtualCluster] = true;
          }
          setAggregatedVirtualClusters(virtualCluster2Subclusters);
          setSchedulerVirtualClusters(response.Clusters);
        }
        setVirtualClusters(allVirtualClusters);
        const allValidVCs = Object.keys(virtualCluster2Subclusters);
        const {keyword, users, virtualClusters, statuses, jobType} = filter;
        const filterVC = new Set(allValidVCs.filter((vc) => virtualClusters.has(vc)));
        setFilter(new Filter(keyword, users, filterVC, statuses, jobType));
      })
    ]).catch((err) => {
      alert(err.message);
    });
    setSubClustersList(getSubClusters());
  }, []);

  /**
   * @returns {import('office-ui-fabric-react').ICommandBarItemProps}
   */
  function getStop() {
    return {
      key: 'stop',
      name: 'Stop',
      buttonStyles: {
        root: {backgroundColor: 'transparent', height: '100%'},
        icon: {fontSize: 14},
      },
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
      const {keyword, virtualClusters, statuses, jobType} = filter;
      const users = new Set(filter.users);
      if (checked) {
        users.delete(key);
      } else {
        users.add(key);
      }
      setFilter(new Filter(keyword, users, virtualClusters, statuses, jobType));
    }

    /**
     * @param {React.SyntheticEvent} event
     */
    function onClearClick(event) {
      event.preventDefault();
      const {keyword, virtualClusters, statuses, jobType} = filter;
      setFilter(new Filter(keyword, new Set(), virtualClusters, statuses, jobType));
      setSearchKey(null);
    }

    function setSubMenuStyle() {
      const subMenuEl = $('.ms-ContextualMenu-Callout .ms-Callout-main');
      if (subMenuEl && subMenuEl.css('overflow') != 'auto')
      subMenuEl.css({'overflow': 'auto'});
    }

    /**
     * @param {React.SyntheticEvent} event
     */
    function searchChange(key) {
      if (key == undefined || key == '') return setSearchKey(null);
      setSearchKey(key.trim());
      setSubMenuStyle();
    }

    function renderClearItem() {
     return (
       <div className={c(t.relative)}>
         <div onClick={onClearClick}
          className={c(t.pa2, t.pointer, t.hoverBgLightGray, t.fixed, t.z999, t.bgWhite, t.bt)}
          style={{width: 180, bottom: 0, paddingRight: 118, paddingLeft: 30, borderTop: '1px solid #ccc'}}>
          Clear
        </div>
       </div>
     );
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
    const searchStyles={
      root: {
        position: 'fixed',
        width: 180,
        zIndex: 100,
      }
    };
    if (users) {
      subMenuItems.push({
        key:"search",
        onRender:() => {
          return (
            <div className={c(t.relative)}>
              <SearchBox styles={searchStyles} onChange= {searchChange} focus= {true} value= {searchKey}/>
            </div>
          );
        }
      })
      // placeholder search
      subMenuItems.push({
        key: 'search',
        text: '',
        disabled: true,
      });
    }
    if (!searchKey) {
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
        onRender: renderClearItem,
      }, {
        key: 'clear',
        text: '',
        disabled: true,
      });
    }else {
      subMenuItems.push(...Object.keys(users)
      .filter((user) => user == searchKey).map(getItem));
      subMenuItems.push({
        key: 'divider',
        itemType: ContextualMenuItemType.Divider,
      }, {
        key: '$clear',
        text: 'Clear',
        onClick: onClearClick,
      });
    }
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
      const {keyword, users, statuses, jobType} = filter;
      const virtualClusters = new Set(filter.virtualClusters);
      if (checked) {
        virtualClusters.delete(key);
      } else {
        virtualClusters.add(key);
      }
      cookies.set('virtualClusterUri', Array.from(virtualClusters), {expires: 7});
      setFilter(new Filter(keyword, users, virtualClusters, statuses, jobType));
    }

    /**
     * @param {React.SyntheticEvent} event
     */
    function onClearClick(event) {
      event.preventDefault();
      cookies.remove('virtualClusterUri');
      const {keyword, users, statuses, jobType} = filter;
      setFilter(new Filter(keyword, users, new Set(), statuses, jobType));
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
        className: getContains(key) ? c(ColorClassNames.themeLighterBackground, ColorClassNames.themeLightBackgroundHover) : '',
        style: getContains(key) ? {fontWeight: '600'} : {fontWeight: '400'},
        onClick: onClick,
      };
    }

    function getContains(key) {
      const subCluster = cookies.get('subClusterUri');
      if (subCluster && schedulerVirtualClusters && schedulerVirtualClusters[subCluster]) {
        return Object.keys(schedulerVirtualClusters[subCluster]).indexOf(key) > -1 ? true : false;
      }
      return false;
    }

    function sortHighLightList(clusters) {
      let headClusterList = [];
      let tealClusterList = [];
      clusters && clusters.map((item, index) => {
        if (getContains(item)) {
         headClusterList.push(item);
        } else {
         tealClusterList.push(item);
        }
       });
       return headClusterList.concat(tealClusterList);
    }

    function renderClearItem() {
      return (
        <div className={c(t.relative)}>
          <div onClick={onClearClick}
            className={c(t.pa2, t.pointer, t.hoverBgLightGray, t.fixed, t.z999, t.bgWhite, t.bt)}
            style={{width: '100%', bottom: 0, paddingRight: 118, paddingLeft: 30, borderTop: '1px solid #ccc'}}>
            Clear
          </div>
        </div>
      );
    }

    return {
      key: 'virtualCluster',
      name: 'Virtual Cluster',
      buttonStyles: {root: {backgroundColor: 'transparent'}},
      iconProps: {
        iconName: 'CellPhone',
      },
      subMenuProps: {
        items: sortHighLightList(Object.keys(virtualClusters) ).map(getItem).concat([{
            key: 'divider',
            itemType: ContextualMenuItemType.Divider,
          },
          {
            key: 'clear',
            text: 'Clear',
            onRender: renderClearItem,
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
  function listSubClusters() {

    function onClick(event, {key}) {
      cookies.set('subClusterUri', key, {expires: 7});
      const params = new URLSearchParams(window.location.search);
      if (params.has('subCluster')) {
        params.delete('subCluster');
        params.append('subCluster', cookies.get('subClusterUri'));
      } else {
        params.append('subCluster', cookies.get('subClusterUri'));
      }
      window.location = `${window.location.protocol}//${window.location.host}/job-list.html?${params}`;
    }

    /**
     * @param {string} key
     * @param {string} text
     * @returns {import('office-ui-fabric-react').IContextualMenuItem}
     */
    function getItem(key) {
      const params = new URLSearchParams(window.location.search);
      return {
        key,
        text: key,
        canCheck: true,
        checked: (cookies.get('subClusterUri') == key && params.get('subCluster')== key),
        className: getContains(key) ? ColorClassNames.themeLighterBackground : '',
        style: getContains(key) ? {fontWeight: '600'} : {fontWeight: '400'},
        onClick: onClick,
      };
    }
    function getContains(key) {
      if (aggregatedVirtualClusters) {
        let subArr = {};
        for (let item of filter.virtualClusters) {
          Object.assign(subArr, aggregatedVirtualClusters[item]);
        }
        return !isEmpty(subArr[key]) ? true : false;
      }
      return false;
    }

    function sortHighLightList(clusters) {
      let headClusterList = [];
      let tealClusterList = [];
      clusters && clusters.map((item, index) => {
        if (getContains(item)) {
         headClusterList.push(item);
        } else {
         tealClusterList.push(item);
        }
       });
       return headClusterList.concat(tealClusterList);
    }

    return {
      key: 'subCluster',
      name: 'Cluster',
      buttonStyles: {root: {backgroundColor: 'transparent'}},
      iconProps: {
        iconName: 'CellPhone',
      },
      subMenuProps: {
        items: sortHighLightList(Object.values(subClustersList) ).map(getItem).concat([{
          key: 'divider',
          itemType: ContextualMenuItemType.Divider,
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
      const {keyword, users, virtualClusters, jobType} = filter;
      const statuses = new Set(filter.statuses);
      if (checked) {
        cookies.remove("status");
        statuses.delete(key);
      } else {
        statuses.add(key);
      }
      setFilter(new Filter(keyword, users, virtualClusters, statuses, jobType));
    }

    /**
     * @param {React.SyntheticEvent} event
     */
    function onClearClick(event) {
      event.preventDefault();
      const {keyword, users, virtualClusters, jobType} = filter;
      cookies.remove("status");
      setFilter(new Filter(keyword, users, virtualClusters, new Set(), jobType));
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

  /**
   * @returns {import('office-ui-fabric-react').ICommandBarItemProps}
   */
  function getJobType() {
    /**
     * @param {React.SyntheticEvent} event
     * @param {import('office-ui-fabric-react').IContextualMenuItem} item
     */
    function onClick(event, {key, checked}) {
      event.preventDefault();
      const {keyword, users, virtualClusters, statuses} = filter;
      
      const jobType = new Set(filter.jobType);
      if (checked) {
        jobType.delete(key);
      } else {
        jobType.add(key);
      }
      
      setFilter(new Filter(keyword, users, virtualClusters, statuses, jobType));
    }

    /**
     * @param {React.SyntheticEvent} event
     */
    function onClearClick(event) {
      event.preventDefault();
      const {keyword, users, virtualClusters, statuses} = filter;
      setFilter(new Filter(keyword, users, virtualClusters, statuses, new Set()));
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
        checked: filter.jobType.has(key),
        onClick: onClick,
      };
    }

    return {
      key: 'jobType',
      name: 'Job Type',
      buttonStyles: {root: {backgroundColor: 'transparent'}},
      iconProps: {
        iconName: 'GroupedList',
      },
      subMenuProps: {
        items: Object.keys(jobType).map(getItem).concat([{
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
    listSubClusters(),
    getVirtualCluster(),
    getRefresh(),
  ];
  const topBarFarItems = [getFilters()];

  const filterBarItems = [getKeyword()];
  const filterBarFarItems = [
    getUser(),
    getStatus(),
    getJobType(),
    getClear(),
  ];

  const {spacing} = getTheme();

  return (
    <React.Fragment>
      <CommandBar
        items={topBarItems}
        farItems={topBarFarItems}
        styles={{root: {backgroundColor: 'transparent', padding: 0}}}
      />
      { active ? <CommandBar
        items={filterBarItems}
        farItems={filterBarFarItems}
        styles={{root: [
          ColorClassNames.neutralLightBackground,
          {marginTop: spacing.s2, paddingTop: spacing.m, paddingBottom: spacing.m, height: 'auto'},
        ]}}
      /> : null }
    </React.Fragment>
  );
}

export default TopBar;
