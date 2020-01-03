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

import t from '../../components/tachyons.scss';

const KEY_HOME = 'HOME';
const KEY_SUBMIT_JOB = 'SUBMITJOB';
const KEY_JOBS = 'JOBS';
const KEY_VC = 'VC';
const KEY_FEEDBACK = 'FEEDBACK';
// admin menu
const KEY_ADMIN = 'ADMIN_MENU';
const KEY_ADMIN_PREFIX = 'ADMIN:';
// admin menu items
const KEY_DASHBOARD = KEY_ADMIN_PREFIX + 'DASHBOARD';
const KEY_SERVICES = KEY_ADMIN_PREFIX + 'SERVICES';
const KEY_HARDWARE = KEY_ADMIN_PREFIX + 'HARDWARE';
const KEY_K8S_DASHBOARD = KEY_ADMIN_PREFIX + 'K8S_DASHBOARD';
const KEY_USER_MANAGEMENT = KEY_ADMIN_PREFIX + 'USER_MANAGEMENT';
// plugin menu
const KEY_PLUGIN = 'PLUGIN';
const KEY_PLUGIN_PREFIX = 'PLUGIN:';

const PLUGIN_PATH = '/plugin.html';

const KEY_DICT = {
  '/home.html': KEY_HOME,
  '/dashboard.html': KEY_DASHBOARD,
  '/submit.html': KEY_SUBMIT_JOB,
  '/job-list.html': KEY_JOBS,
  '/virtual-clusters.html': KEY_VC,
  '/cluster-view/services.html': KEY_SERVICES,
  '/cluster-view/hardware.html': KEY_HARDWARE,
  '/cluster-view/hardware/detail.html': KEY_HARDWARE,
  '/cluster-view/k8s.html': KEY_K8S_DASHBOARD,
  '/user-view.html': KEY_USER_MANAGEMENT,
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
        color: palette.black,
      },
      ColorClassNames.neutralLightBackground,
      isSelected && ColorClassNames.neutralQuaternaryBackground,
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
  const [administrationExpanded, setAdministrationExpanded] = useState(false);
  const [pluginExpanded, setPluginExpanded] = useState(false);

  useEffect(() => {
    const pathName = window.location.pathname;
    if (pathName === PLUGIN_PATH) {
      const params = new URLSearchParams(window.location.search);
      const idx = params.get('index');
      setKey(KEY_PLUGIN_PREFIX + idx);
      setPluginExpanded(true);
      return;
    }
    const key = KEY_DICT[pathName];
    if (key && key.startsWith(KEY_ADMIN_PREFIX)) {
      setAdministrationExpanded(true);
    }
    setKey(key);
  }, []);

  const selectedKey = useMemo(() => {
    if (key && key.startsWith(KEY_ADMIN_PREFIX) && !administrationExpanded) {
      return KEY_ADMIN;
    } else if (key && key.startsWith(KEY_PLUGIN_PREFIX) && !pluginExpanded) {
      return KEY_PLUGIN;
    } else {
      return key;
    }
  }, [key, administrationExpanded, pluginExpanded]);

  const plugins = config.PAI_PLUGINS;
  const isAdmin = cookies.get('admin') === 'true';

  return (
    <div
      className={c(ColorClassNames.neutralLightBackground, className)}
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
          if (link.key === KEY_ADMIN) {
            chevronIcon = (
              <Icon
                iconName={administrationExpanded ? 'chevronUp' : 'chevronDown'}
              />
            );
          }
          if (link.key === KEY_PLUGIN) {
            chevronIcon = (
              <Icon iconName={pluginExpanded ? 'chevronUp' : 'chevronDown'} />
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
                url: '/submit.html',
                icon: 'NewFolder',
                key: KEY_SUBMIT_JOB,
              },
              {
                name: 'Jobs',
                url: '/job-list.html',
                icon: 'CheckList',
                key: KEY_JOBS,
              },
              {
                name: 'Virtual Clusters',
                url: '/virtual-clusters.html',
                icon: 'Quantity',
                style: {
                  display:
                    isAdmin && config.launcherType !== 'k8s'
                      ? undefined
                      : 'none',
                },
                key: KEY_VC,
              },
              {
                name: 'Administration',
                isExpanded: administrationExpanded,
                onClick: () =>
                  setAdministrationExpanded(!administrationExpanded),
                icon: 'Settings',
                key: KEY_ADMIN,
                style: {
                  display: isAdmin ? undefined : 'none',
                },
                links: [
                  {
                    name: 'Dashboard',
                    url: '/dashboard.html',
                    icon: 'SpeedHigh',
                    key: KEY_DASHBOARD,
                  },
                  {
                    name: 'Services',
                    url: '/cluster-view/services.html',
                    key: KEY_SERVICES,
                    icon: 'MapLayers',
                  },
                  {
                    name: 'Hardware',
                    url: '/cluster-view/hardware.html',
                    key: KEY_HARDWARE,
                    icon: 'HardDriveGroup',
                  },
                  {
                    name: 'K8s Dashboard',
                    url: '/cluster-view/k8s.html',
                    key: KEY_K8S_DASHBOARD,
                    icon: 'SpeedHigh',
                  },
                  {
                    name: 'User Management',
                    url: '/user-view.html',
                    key: KEY_USER_MANAGEMENT,
                    style: {
                      display:
                        config.authnMethod !== 'OIDC' ? undefined : 'none',
                    },
                    icon: 'PlayerSettings',
                  },
                ],
              },
              {
                name: 'Feedback',
                url: `https://github.com/Microsoft/pai/issues/new?${qs.stringify(
                  {
                    title: `Feedback ${window.PAI_VERSION}`,
                  },
                )}`,
                key: KEY_FEEDBACK,
                icon: 'Feedback',
                target: '_blank',
              },
              {
                name: 'Plugins',
                isExpanded: pluginExpanded,
                onClick: () => setPluginExpanded(!pluginExpanded),
                icon: 'Puzzle',
                key: KEY_PLUGIN,
                style: { display: isEmpty(plugins) ? 'none' : undefined },
                links: (plugins || []).map((item, idx) => ({
                  name: item.title,
                  url: `/plugin.html?index=${idx}`,
                  key: KEY_PLUGIN_PREFIX + idx,
                  icon: 'Puzzle',
                })),
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
