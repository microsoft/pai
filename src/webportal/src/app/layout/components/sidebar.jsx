// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Nav, ColorClassNames, getTheme, Icon } from 'office-ui-fabric-react';
import c from 'classnames';
import cookies from 'js-cookie';
import qs from 'querystring';
import { isEmpty } from 'lodash';

import config from '../../config/webportal.config';
require('./style.scss');
import t from '../../components/tachyons.scss';
import { useCallback } from 'react';

const KEY_HOME = 'HOME';
const KEY_SUBMIT_JOB = 'SUBMITJOB';
const KEY_JOB_LIST = 'JOBLIST';
const KEY_VIRTUAL_CLUSTERS = 'VIRTUALCLUSTERS';
const KEY_HTTPFS = 'HTTPFS';

const KEY_MARKETPLACE = 'MARKETPLACE:';
const KEY_EXAMPLE_LIST = KEY_MARKETPLACE + 'EXAMPLELIST';
const KEY_MODULE_LIST = KEY_MARKETPLACE + 'MODULELIST';

const KEY_DICT = {
  '/test.html': KEY_HOME,
  '/submit.html': KEY_SUBMIT_JOB,
  '/marketplace.html': KEY_EXAMPLE_LIST,
  '/module-list.html': KEY_MODULE_LIST,
  '/job-list.html': KEY_JOB_LIST,
  '/virtual-clusters.html': KEY_VIRTUAL_CLUSTERS,
  '/httpfs.html': KEY_HTTPFS
};

const NavStyles = props => {
  const { navHeight = 48, leftPadding, isSelected } = props;
  const { palette } = getTheme();
  return {
    navItems: {
      margin: 0,
    },
    link: [
      {
        height: navHeight,
        lineHeight: `${navHeight}px`,
        paddingLeft: leftPadding + 16,
        selectors: {
          '.ms-Nav-compositeLink:hover &': {
            backgroundColor: palette.neutralQuaternaryAlt,
            textDecoration: 'none',
          },
        },
        color: palette.white,
      },
      {background: "#222D32"},
      isSelected && {background: "#1E282C"},
    ],
    groupContent: {
      animation: 'none',
      marginBottom: 0,
    },
    chevronButton: {
      display: 'none',
    },
    chevronIcon: {
      height: navHeight,
      lineHeight: `${navHeight}px`,
    },
  };
};

const Sidebar = ({ className, style }) => {
  const [key, setKey] = useState();
  const [marketplaceExpanded, setMarketplaceExpanded] = useState(true);
  const subClusterUri = cookies.get('subClusterUri');
  const { palette } = getTheme();

  useEffect(() => {
    const pathName = window.location.pathname;
    const key = KEY_DICT[pathName];
    if (key && key.startsWith(KEY_MARKETPLACE)) {
        setMarketplaceExpanded(true);
    }
    setKey(key);
  }, []);

  useEffect(()=> {
    cleanLocalStorageKey();
  }, []);

  const cleanLocalStorageKey = useCallback(()=> {
    const items = ['endTime_', 'startTime_', "recordTimes_", "delayTimes_"];
    for (const key in window.localStorage) {
      const value = window.localStorage[key].toString();
      items.forEach((item)=> {
        if (value.indexOf(item) > -1) {
          key && window.localStorage.removeItem(key);
        }
      })
    };
  });

  const selectedKey = useMemo(() => {
      return key;
  }, [key, marketplaceExpanded]);

  return (
    <div
      className="sidebar"
      style={style}
    >
      <Nav
        selectedKey={selectedKey}
        styles={NavStyles}
        onLinkClick={(e, item) => {
          if (item.key === key) {
            e.preventDefault();
          }
        }}
        onRenderLink={link => {
          let chevronIcon;
          if (link.key === KEY_MARKETPLACE) {
            chevronIcon = (
              <Icon
                iconName={marketplaceExpanded ? 'chevronUp' : 'chevronDown'}
              />
            );
          }
          return (
            <div className={c(t.flexAuto, t.flex, t.justifyBetween)}>
              <div className={t.ml2}>{link.name}</div>
              <div>{chevronIcon}</div>
            </div>
          );
        }}
        groups={[
          {
            links: [
             {
                name: 'Home',
                url: '/home.html',
                icon: 'Home',
                key: KEY_HOME,
              },
              {
                name: 'Submit Job',
                url: '/marketplace.html',
                icon: 'CustomList',
                key: KEY_EXAMPLE_LIST
              },
              {
                name: 'Jobs',
                url: subClusterUri ? `/job-list.html?subCluster=${subClusterUri}` : `/job-list.html`,
                icon: 'CheckList',
                key: KEY_JOB_LIST,
              },
              {
                name: 'Files',
                url: `/httpfs.html?subCluster=${subClusterUri}`,
                icon: 'FolderQuery',
                key: KEY_HTTPFS,
              },
              {
                name: 'Virtual Clusters',
                url: `/virtual-clusters.html?subCluster=${subClusterUri}`,
                icon: 'BuildQueue',
                key: KEY_VIRTUAL_CLUSTERS,
              },
              {
                name: 'Advanced',
                isExpanded: marketplaceExpanded,
                onClick: () =>
                  setMarketplaceExpanded(!marketplaceExpanded),
                icon: 'DocumentSet',
                key: KEY_MARKETPLACE,
                links: [
                  {
                    name: 'Modules',
                    url: '/module-list.html',
                    key: KEY_MODULE_LIST,
                    icon: 'Product',
                  },
                ],
              },
            ],
          },
        ]}
      />
    </div>
  );
};

Sidebar.propTypes = {
  className: PropTypes.string,
  style: PropTypes.object,
  admin: PropTypes.bool,
};

export default Sidebar;
