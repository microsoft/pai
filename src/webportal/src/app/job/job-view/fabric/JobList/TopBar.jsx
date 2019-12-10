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

import cookies from 'js-cookie';
import React, { useContext, useState, useEffect } from 'react';
import {
  getTheme,
  ColorClassNames,
  CommandBar,
  CommandBarButton,
  SearchBox,
  Stack,
} from 'office-ui-fabric-react';

import Context from './Context';
import Filter from './Filter';

import webportalConfig from '../../../../config/webportal.config';
import { clearToken } from '../../../../user/user-logout/user-logout.component';
import FilterButton from './FilterButton';
import { isStoppable } from '../../../../components/util/job';

const CURRENT_USER_KEY = '@Me';
const token = cookies.get('token');

function KeywordSearchBox() {
  const { filter, setFilter } = useContext(Context);
  function onKeywordChange(keyword) {
    const { users, virtualClusters, statuses } = filter;
    setFilter(new Filter(keyword, users, virtualClusters, statuses));
  }

  /** @type {import('office-ui-fabric-react').IStyle} */
  const rootStyles = {
    backgroundColor: 'transparent',
    alignSelf: 'center',
    width: 220,
  };
  return (
    <SearchBox
      underlined
      placeholder='Filter by keyword'
      styles={{ root: rootStyles }}
      value={filter.keyword}
      onChange={onKeywordChange}
    />
  );
}

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

  const { refreshJobs, selectedJobs, stopJob, filter, setFilter } = useContext(
    Context,
  );

  useEffect(() => {
    Promise.all([
      fetch(`${webportalConfig.restServerUri}/api/v2/user`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }).then(async response => {
        if (response.ok) {
          const data = await response.json();
          const users = {};
          data.forEach(user => {
            users[user.username] = true;
          });
          setUser(users);
        } else {
          const data = await response.json().catch(() => {
            throw new Error(
              `Failed to fetch user info: ${response.status} ${response.statusText}`,
            );
          });
          if (data.message) {
            if (data.code === 'UnauthorizedUserError') {
              alert(data.message);
              clearToken();
            } else {
              throw new Error(`Failed to fetch user info: ${data.message}`);
            }
          } else {
            throw new Error(
              `Failed to fetch user info: ${response.status} ${response.statusText}`,
            );
          }
        }
      }),
      fetch(`${webportalConfig.restServerUri}/api/v2/virtual-clusters`).then(
        async response => {
          if (response.ok) {
            const data = await response.json();
            const vcs = {};
            for (const vcName of Object.keys(data)) {
              vcs[vcName] = true;
            }
            setVirtualClusters(vcs);
            const allValidVC = Object.keys(data);
            const { keyword, users, virtualClusters, statuses } = filter;
            const filterVC = new Set(
              allValidVC.filter(vc => virtualClusters.has(vc)),
            );
            setFilter(new Filter(keyword, users, filterVC, statuses));
          } else {
            const data = await response.json().catch(() => {
              throw new Error(
                `Failed to fetch virtual cluster info: ${response.status} ${response.statusText}`,
              );
            });
            if (data.message) {
              if (data.code === 'UnauthorizedUserError') {
                alert(data.message);
                clearToken();
              } else {
                throw new Error(
                  `Failed to fetch virtual cluster info: ${data.message}`,
                );
              }
            } else {
              throw new Error(
                `Failed to fetch virtual cluster info: ${response.status} ${response.statusText}`,
              );
            }
          }
        },
      ),
    ]).catch(err => alert(err.message));
  }, []);

  /**
   * @returns {import('office-ui-fabric-react').ICommandBarItemProps}
   */
  function getStop() {
    return {
      key: 'stop',
      name: 'Stop',
      buttonStyles: {
        root: { backgroundColor: 'transparent', height: '100%' },
        icon: { fontSize: 14 },
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
  function getNew() {
    return {
      key: 'new',
      name: 'New',
      buttonStyles: {
        root: { backgroundColor: 'transparent', height: '100%' },
      },
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
      buttonStyles: {
        root: { backgroundColor: 'transparent', height: '100%' },
      },
      iconProps: {
        iconName: 'Refresh',
      },
      onClick: refreshJobs,
    };
  }

  /**
   * @returns {import('office-ui-fabric-react').ICommandBarItemProps}
   */
  function getFilters() {
    return {
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
            styles={{ root: { backgroundColor: 'transparent' } }}
          >
            Filter
          </CommandBarButton>
        );
      },
    };
  }

  const ableStop =
    selectedJobs.length > 0 && selectedJobs.every(job => isStoppable(job));

  const topBarItems = [ableStop ? getStop() : getNew(), getRefresh()];
  const topBarFarItems = [getFilters()];

  // user filter preprocess
  let userItems = Object.keys(users);
  const currentUser = cookies.get('user');
  const idx = userItems.findIndex(x => x === currentUser);
  if (idx !== -1) {
    userItems = [
      CURRENT_USER_KEY,
      ...userItems.slice(0, idx),
      ...userItems.slice(idx + 1),
    ];
  }

  const userFilter = new Set(filter.users);
  if (userFilter.has(currentUser)) {
    userFilter.delete(currentUser);
    userFilter.add(CURRENT_USER_KEY);
  }
  const selectedItems = Array.from(userFilter);

  const { spacing } = getTheme();

  return (
    <React.Fragment>
      <CommandBar
        items={topBarItems}
        farItems={topBarFarItems}
        styles={{ root: { backgroundColor: 'transparent', padding: 0 } }}
      />
      {active && (
        <Stack
          horizontal
          verticalAlign='stretch'
          horizontalAlign='space-between'
          styles={{
            root: [
              ColorClassNames.neutralLightBackground,
              {
                marginTop: spacing.s2,
                padding: spacing.m,
              },
            ],
          }}
        >
          <KeywordSearchBox />
          <Stack horizontal>
            <FilterButton
              styles={{ root: { backgroundColor: 'transparent' } }}
              text='User'
              iconProps={{ iconName: 'Contact' }}
              items={userItems}
              selectedItems={selectedItems}
              onSelect={users => {
                const { keyword, virtualClusters, statuses } = filter;
                const userFilter = new Set(users);
                if (userFilter.has(CURRENT_USER_KEY)) {
                  userFilter.delete(CURRENT_USER_KEY);
                  userFilter.add(currentUser);
                }
                setFilter(
                  new Filter(keyword, userFilter, virtualClusters, statuses),
                );
              }}
              searchBox
              clearButton
            />
            <FilterButton
              styles={{ root: { backgroundColor: 'transparent' } }}
              text='Virtual Cluster'
              iconProps={{ iconName: 'CellPhone' }}
              items={Object.keys(virtualClusters)}
              selectedItems={Array.from(filter.virtualClusters)}
              onSelect={virtualClusters => {
                const { keyword, users, statuses } = filter;
                setFilter(
                  new Filter(
                    keyword,
                    users,
                    new Set(virtualClusters),
                    statuses,
                  ),
                );
              }}
              clearButton
            />
            <FilterButton
              styles={{ root: { backgroundColor: 'transparent' } }}
              text='Status'
              iconProps={{ iconName: 'Clock' }}
              items={Object.keys(statuses)}
              selectedItems={Array.from(filter.statuses)}
              onSelect={statuses => {
                const { keyword, users, virtualClusters } = filter;
                setFilter(
                  new Filter(
                    keyword,
                    users,
                    virtualClusters,
                    new Set(statuses),
                  ),
                );
              }}
              clearButton
            />
            <CommandBarButton
              styles={{
                root: { backgroundColor: 'transparent', height: '100%' },
              }}
              iconProps={{ iconName: 'Cancel' }}
              onClick={() => setFilter(new Filter())}
            />
          </Stack>
        </Stack>
      )}
    </React.Fragment>
  );
}

export default TopBar;
