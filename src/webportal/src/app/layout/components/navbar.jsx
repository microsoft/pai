// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from 'react';
import PropTypes from 'prop-types';
import c from 'classnames';
import cookies from 'js-cookie';
import {
  ColorClassNames,
  CommandBarButton,
  concatStyleSets,
} from 'office-ui-fabric-react';

import { userLogout } from '../../user/user-logout/user-logout.component';
import { NotificationButton } from './alerts';

import t from '../../components/tachyons.scss';

const CustomButton = props => (
  <CommandBarButton
    {...props}
    styles={concatStyleSets(props.styles, {
      root: [ColorClassNames.themePrimaryBackground, ColorClassNames.white],
      rootHovered: [
        ColorClassNames.themeDarkAltBackground,
        ColorClassNames.white,
      ],
      rootPressed: [ColorClassNames.themeDarkBackground, ColorClassNames.white],
      rootExpanded: [
        ColorClassNames.themeDarkBackground,
        ColorClassNames.white,
      ],
      icon: [ColorClassNames.white],
      menuIcon: [ColorClassNames.white],
    })}
  />
);

CustomButton.propTypes = {
  styles: PropTypes.object,
};

const Navbar = ({ onToggleSidebar, mobile }) => {
  const username = cookies.get('user');
  return (
    <div
      className={c(
        t.h100,
        t.flex,
        t.justifyBetween,
        t.relative,
        ColorClassNames.themePrimaryBackground,
      )}
    >
      {mobile && (
        <div className={c(t.absolute, t.absoluteFill, t.pa2)}>
          <img src='/favicon.ico' className={c(t.h100, t.db, t.center)} />
        </div>
      )}
      <div className={t.h100}>
        {/* navbar - left */}
        {mobile && (
          <CustomButton
            key='toggle'
            className={t.h100}
            iconProps={{ iconName: 'GlobalNavButton' }}
            onClick={onToggleSidebar}
          />
        )}
      </div>
      <div className={c(t.h100, t.flex)}>
        <CustomButton>
          <NotificationButton />
        </CustomButton>
        <CustomButton
          key='help'
          href='/docs.html'
          iconProps={{ iconName: 'Help' }}
          style={{
            textDecoration: 'none',
            display: mobile ? 'none' : undefined,
          }}
        />
        <CustomButton
          key='menu'
          text={!mobile && `Welcome, ${username}`}
          iconProps={mobile && { iconName: 'PlayerSettings' }}
          menuProps={{
            items: [
              {
                key: 'profile',
                text: 'My profile',
                href: '/user-profile.html',
                style: { textDecoration: 'none' },
              },
              {
                key: 'logout',
                text: 'Logout',
                onClick: () => userLogout(),
              },
            ],
          }}
        />
      </div>
    </div>
  );
};

Navbar.propTypes = {
  mobile: PropTypes.bool,
  onToggleSidebar: PropTypes.func.isRequired,
};

export default Navbar;
