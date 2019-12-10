// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from 'react';
import PropTypes from 'prop-types';
import cookies from 'js-cookie';
import {
  CommandBar,
  ColorClassNames,
  CommandBarButton,
  concatStyleSets,
} from 'office-ui-fabric-react';

import { userLogout } from '../../user/user-logout/user-logout.component';
import { NotificationButton } from './alerts';

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

const Navbar = ({ className, style, onToggleSidebar }) => {
  const username = cookies.get('user');
  return (
    <CommandBar
      buttonAs={CustomButton}
      styles={{
        root: [
          { height: '100%' },
          ColorClassNames.themePrimaryBackground,
          className,
          style,
        ],
      }}
      items={[
        {
          key: 'toggle',
          iconProps: { iconName: 'GlobalNavButton' },
          onClick: onToggleSidebar,
        },
      ]}
      farItems={[
        { key: 'alert', onRenderIcon: () => <NotificationButton /> },
        { key: 'help', href: '/docs.html', iconProps: { iconName: 'help' } },
        {
          key: 'menu',
          text: `Welcome, ${username}`,
          subMenuProps: {
            items: [
              {
                key: 'profile',
                text: 'My profile',
                href: '/user-profile.html',
              },
              { key: 'logout', text: 'Logout', onClick: () => userLogout() },
            ],
          },
        },
      ]}
    />
  );
};

Navbar.propTypes = {
  className: PropTypes.string,
  style: PropTypes.object,
  onToggleSidebar: PropTypes.func.isRequired,
};

export default Navbar;
