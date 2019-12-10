// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Nav, ColorClassNames, getTheme } from 'office-ui-fabric-react';
import c from 'classnames';

const KEY_HOME = 'HOME';
const KEY_DASHBOARD = 'DASHBOARD';
const KEY_SUBMIT_JOB = 'SUBMITJOB';
const KEY_JOBS = 'JOBS';
const KEY_VC = 'VC';
const KEY_ADMIN = 'ADMIN_MENU';
const KEY_ADMIN_PREFIX = 'ADMIN:';
const KEY_SERVICES = KEY_ADMIN_PREFIX + 'SERVICES';
const KEY_HARDWARE = KEY_ADMIN_PREFIX + 'HARDWARE';
const KEY_K8S_DASHBOARD = KEY_ADMIN_PREFIX + 'K8S_DASHBOARD';
const KEY_USER_MANAGEMENT = KEY_ADMIN_PREFIX + 'USER_MANAGEMENT';
const KEY_FEEDBACK = 'FEEDBACK';

const KEY_DICT = {
  '/home.html': KEY_HOME,
  '/dashboard.html': KEY_DASHBOARD,
  '/submit.html': KEY_SUBMIT_JOB,
  '/job-list.html': KEY_JOBS,
  '/virtual-clusters.html': KEY_VC,
  '/cluster-view/services.html': KEY_SERVICES,
  '/cluster-view/hardware.html': KEY_HARDWARE,
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

  useEffect(() => {
    const pathName = window.location.pathname;
    const key = KEY_DICT[pathName];
    if (key && key.startsWith(KEY_ADMIN_PREFIX)) {
      setAdministrationExpanded(true);
    }
    setKey(key);
  }, []);

  const selectedKey = useMemo(() => {
    if (key && key.startsWith(KEY_ADMIN_PREFIX)) {
      return KEY_ADMIN;
    } else {
      return key;
    }
  }, [key, administrationExpanded]);

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
                name: 'Dashboard',
                url: '/dashboard.html',
                icon: 'SpeedHigh',
                key: KEY_DASHBOARD,
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
                key: KEY_VC,
              },
              {
                name: 'Administration',
                isExpanded: administrationExpanded,
                onClick: () =>
                  setAdministrationExpanded(!administrationExpanded),
                icon: 'Settings',
                key: KEY_ADMIN,
                links: [
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
                    icon: 'PlayerSettings',
                  },
                ],
              },
              {
                name: 'Feedback',
                url: `https://github.com/Microsoft/pai/issues/new?title=[Feedback%20${encodeURIComponent(
                  window.PAI_VERSION,
                )}]`,
                key: KEY_FEEDBACK,
                icon: 'Feedback',
                target: '_blank',
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
};

export default Sidebar;
