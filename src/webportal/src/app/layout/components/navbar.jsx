// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import c from 'classnames';
import cookies from 'js-cookie';
import {
  ColorClassNames,
  CommandBarButton,
  concatStyleSets,
  Callout,
  DirectionalHint,
  PersonaCoin,
  Link,
  FontClassNames,
  FontWeights,
  PersonaSize,
  getTheme,
  PersonaInitialsColor,
} from 'office-ui-fabric-react';

import { userLogout } from '../../user/user-logout/user-logout.component';
import { NotificationButton } from './alerts';

import t from '../../components/tachyons.scss';

const CustomButton = props => (
  <CommandBarButton
    {...props}
    styles={concatStyleSets(
      {
        root: [ColorClassNames.themePrimaryBackground, ColorClassNames.white],
        rootHovered: [
          ColorClassNames.themeDarkAltBackground,
          ColorClassNames.white,
        ],
        rootPressed: [
          ColorClassNames.themeDarkBackground,
          ColorClassNames.white,
        ],
        icon: [ColorClassNames.white],
        iconHovered: [ColorClassNames.white],
        iconPressed: [ColorClassNames.white],
        iconFocused: [ColorClassNames.white],
      },
      props.styles,
    )}
  />
);

CustomButton.propTypes = {
  styles: PropTypes.object,
};

const Navbar = ({ onToggleSidebar, mobile, userInfo }) => {
  const username = cookies.get('user');
  const { spacing, palette } = getTheme();
  const menuButtonRef = useRef();
  const [menuVisible, setMenuVisible] = useState(false);
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
        <div ref={menuButtonRef}>
          <CustomButton
            key='menu'
            text={!mobile && `Welcome, ${username}`}
            styles={concatStyleSets(
              {
                root: { height: '100%' },
              },
              mobile && {
                menuIcon: { display: 'none' },
                label: { display: 'none' },
              },
              menuVisible && {
                root: [ColorClassNames.themeDarkBackground],
                rootHovered: [ColorClassNames.themeDarkBackground],
                rootPressed: [ColorClassNames.themeDarkBackground],
              },
            )}
            iconProps={mobile && { iconName: 'Contact' }}
            onClick={e => {
              setMenuVisible(!menuVisible);
              e.preventDefault();
            }}
          />
        </div>
        <Callout
          gapSpace={0}
          isBeakVisible={false}
          target={menuButtonRef.current}
          hidden={!menuVisible}
          minPagePadding={0}
          directionalHint={DirectionalHint.bottomRightEdge}
          onDismiss={e => {
            setMenuVisible(false);
            e.preventDefault();
          }}
        >
          <div>
            <div className={c(t.flex)}>
              <div className={c(t.pa3, t.flexAuto)}>Platform for AI</div>
              <CommandBarButton
                styles={{
                  root: [
                    { padding: spacing.m },
                    ColorClassNames.whiteBackground,
                  ],
                }}
                onClick={userLogout}
              >
                Sign Out
              </CommandBarButton>
            </div>
            <div className={c(t.flex, t.pa3)}>
              <PersonaCoin
                initialsColor={PersonaInitialsColor.transparent}
                styles={{
                  initials: [
                    ColorClassNames.neutralSecondary,
                    {
                      borderRadius: '50%',
                      border: `4px solid ${palette.neutralSecondary}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    },
                  ],
                }}
                text={username}
                size={PersonaSize.size100}
              />
              <div className={c(t.ml5)}>
                <div
                  className={FontClassNames.xLarge}
                  style={{ fontWeight: FontWeights.regular }}
                >
                  {username}
                </div>
                <div className={t.mt3}>{userInfo.email}</div>
                <div className={t.mt4}>
                  <Link href='/user-profile.html'>View my profile</Link>
                </div>
              </div>
            </div>
          </div>
        </Callout>
      </div>
    </div>
  );
};

Navbar.propTypes = {
  mobile: PropTypes.bool,
  onToggleSidebar: PropTypes.func.isRequired,
  userInfo: PropTypes.object,
};

export default Navbar;
