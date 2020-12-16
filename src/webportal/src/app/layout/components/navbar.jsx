// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import c from 'classnames';
import t from '../../components/tachyons.scss';
import cookies from 'js-cookie';
import config from '../../config/webportal.config';
require('./style.scss');
const userAuth = require('../../user/user-auth/user-auth.component');
import { Spinner, SpinnerSize } from 'office-ui-fabric-react/lib/Spinner';
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
  Stack,
  Text,
  TextField,
  values,
  Separator,
} from 'office-ui-fabric-react';
import { Label } from 'office-ui-fabric-react/lib/Label';
import { ActionButton, IButtonProps } from 'office-ui-fabric-react/lib/Button';
import { PrimaryButton } from 'office-ui-fabric-react/lib/Button';
import HTMLEllipsis from 'react-lines-ellipsis/lib/html'
import { Panel, PanelType } from 'office-ui-fabric-react/lib/Panel';
import { IconButton } from 'office-ui-fabric-react/lib/Button';
import { Dropdown, IDropdown, DropdownMenuItemType, IDropdownOption } from 'office-ui-fabric-react/lib/Dropdown';

import Sidebar from './sidebar';
import { userLogout } from '../../user/user-logout/user-logout.component';
import { defaultRestServerClient } from '../../common/http-client';

const CustomButton = props => (
    <CommandBarButton
      {...props}
      styles={concatStyleSets(
        {
          root: [ {background: "#3C8DBC"}, ColorClassNames.white],
          rootHovered: [
            {background: "#357CA5"},
            ColorClassNames.white,
          ],
          rootPressed: [
            {background: "#357CA5"},
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

const Navbar = () => {
    const username = cookies.get('user');
    const admin = cookies.get('admin') === 'true';
    const subCluster = cookies.get('subClusterUri');
    const { spacing, palette } = getTheme();
    const menuButtonRef = useRef();
    const [menuVisible, setMenuVisible] = useState(false);
    const [panelVisible, setPanelVisible] = useState(false);
    const [expiryDurationDays, setExpiryDurationDays] = useState(undefined);
    const [token, setToken] = useState(undefined);
    const [userName, setUserName] = useState(username);
    const [selectAdmin, setSelectAdmin] = useState("false");
    const [sendingRequest, setSendingRequest] = useState(false);
    const createToken = () => {
      let tokenCreateUri = `/api/v2/token`;
      if (isNaN(Number(expiryDurationDays)) || Number(expiryDurationDays) <= 0 || Number(expiryDurationDays) > 365) {
        alert("Expiry Duration Days must be a number between [1, 365]!");
        return;
      }
      setSendingRequest(true);
      let expiryDurationSecs = Number(expiryDurationDays) * 3600 * 24;
      let requestBody = {"expiryDurationSecs": Number(expiryDurationSecs)};
      if (admin) {
        requestBody["admin"] = selectAdmin === 'true';
        requestBody["userName"] = userName;
      }
      defaultRestServerClient.post(tokenCreateUri, requestBody).then((response) => {
        setToken(response.data.token);
        setSendingRequest(false);
      }).catch((err) => {
        if (err.response) {
          alert(`Failed to create token. Message: ${err.response.data.message}`);
        } else {
          alert(`Failed to create token. Message: ${err.message}`);
        }
        setSendingRequest(false);
      });
    };

    return (
      <div
        className={c(
          t.h100,
          t.flex,
          t.justifyBetween,
          t.itemsCenter,
          t.relative,
          "navbar"
        )}
      >
        <Stack styles={{root: {flexGrow: 1, maxWidth: 750}}}>
          <marquee id='scroll_news' className="navbar navbar-notice-board" direction="left" scrollamount="4">
            <div className={c(FontClassNames.medium, t.fw5)}> <font color="white">We invite you to take a brief &nbsp;
                <a href="https://forms.office.com/Pages/ResponsePage.aspx?id=v4j5cvGGr0GRqy180BHbRyg-dtGsALZAio9mOLpIiS5UQzgxVEQ1UVZYNlMyS0YyMVExRjkwNzVOQS4u" target="_blank">survey</a>&nbsp; to share your experience on MT with us.
                </font>
            </div>
          </marquee>
        </Stack>
        <div className={c(t.h100, t.flex)}>
          <CustomButton
            key='doc'
            href='https://mtpwiki.azurewebsites.net/use/WebPortal/WebPortal.html'
            iconProps={{ iconName: 'Unknown' }}
            style={{
              textDecoration: 'none',
              display: undefined,
            }}
          />
          <div ref={menuButtonRef}>
            <CustomButton
              key='menu'
              text={`Welcome to ${subCluster}, ${username}`}
              styles={concatStyleSets(
                {
                  root: { height: '100%' },
                }
              )}
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
              <div className={c(t.pa3, t.flexAuto)}>{subCluster}</div>
                <CommandBarButton
                  iconProps={{ iconName: 'Leave' }}
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
                  style={{ paddingLeft: spacing.m, fontWeight: FontWeights.regular }}
                >
                  {username}
                </div>
                
                <ActionButton
                  style={{ fontWeight: FontWeights.regular }}
                  onClick={()=>{setPanelVisible(true)}}
                >
                  <font color="4A8EBE">Generate Token</font>
                </ActionButton>
              </div>
            </div>
          </Callout>
        </div>
        <Panel
          isOpen={panelVisible}
          onDismiss={()=>{setPanelVisible(false)}}
          type={PanelType.medium}
          headerText="Generate Token"
          closeButtonAriaLabel="Close"
          styles={{
            content: {padding: '0!important'},
            overlay: [ColorClassNames.blackTranslucent40Background],
            content: [t.flex, t.flexAuto, t.flexColumn, {padding: '0!important'}],
            scrollableContent: [t.flex, t.flexAuto],
          }}
        >
          <Stack >
            <Stack styles={{root:{marginTop:50}}} horizontal >
              <Stack styles={{root:{width: 250}}} horizontal>
                <IconButton iconProps={{ iconName: 'Info' }} title={'The new token will be expired in next expiry duration days'} />
                  <Stack 
                  className={FontClassNames.large}
                  style={{ fontWeight: FontWeights.regular }}>
                    <Label styles={{root:{marginLeft:20}}}>Expiry Duration Days</Label>
                </Stack>
              </Stack>
              <TextField required={true} onChange={(event, value)=>{setExpiryDurationDays(value)}} style={{width:250}}></TextField>
            </Stack>
            {
              admin? 
              <Stack tokens={{childrenGap: 10}}>
                <Separator alignContent="start" styles={{root:{marginTop:20}}}>Admin field</Separator>
                <Stack styles={{root:{marginTop:10}}} horizontal >
                  <Stack styles={{root:{width: 250}}} horizontal>
                    <IconButton iconProps={{ iconName: 'Info' }} title={'The new token\'s userName field.Only MT Admin can set it to non-default value'} />
                    <Stack 
                    className={FontClassNames.large}
                    style={{  fontWeight: FontWeights.regular }}>
                      <Label styles={{root:{marginLeft:20}}}>User Name</Label>
                    </Stack>
                  </Stack>
                  <TextField required={true} value={userName} onChange={(event, value)=>{setUserName(value)}} style={{width:250}}></TextField>
                </Stack>
                <Stack styles={{root:{marginTop:10}}} horizontal >
                  <Stack styles={{root:{width: 250}}} horizontal>
                    <IconButton iconProps={{ iconName: 'Info' }} title={'The new token\'s admin field.Only MT Admin can set it to non-default value'} />
                      <Stack 
                      className={FontClassNames.large}
                      style={{ fontWeight: FontWeights.regular }}>
                        <Label styles={{root:{marginLeft:20}}}>Admin Token</Label>
                      </Stack>
                  </Stack>
                  <Dropdown styles={{root:{width:250}}} options={[
                    { key: 'true', text: 'true', title: 'true' },
                    { key: 'false', text: 'false', title: 'false' },
                   ]} selectedKey={selectAdmin} onChange={(event, value) => {setSelectAdmin(value.text)}}></Dropdown>
                </Stack>
              </Stack>
              :
              null
            }
            <Stack styles={{root:{marginTop: 100, marginLeft: 390}}}>
                <PrimaryButton disabled={userName === undefined || userName === '' || expiryDurationDays === undefined || expiryDurationDays === ''} styles={{root:{marginTop: 50, width:100}}} text="Create" onClick={createToken}></PrimaryButton>
            </Stack>
            {
              sendingRequest?
              <Stack>
                  <Spinner styles={{root:{marginTop:100}}} size={SpinnerSize.large}></Spinner>
              </Stack>
              :
              null
            }
            {
              token && !sendingRequest?
                <Stack>
                  <Separator></Separator>
                  <Label styles={{root:{marginTop:100, width:500}}}>{token}</Label>
                  <Separator alignContent="end">
                    <ActionButton title="Copy" iconProps={{ iconName: 'Copy' }} onClick={()=>{
                      const el = document.createElement('textarea');
                      el.value = token;
                      document.body.appendChild(el);
                      el.select();
                      document.execCommand('copy');
                      document.body.removeChild(el);
                      alert("Copy to clipboard success!")
                    }}></ActionButton>
                  </Separator>
                </Stack>
              :
              null
            }

          </Stack>
        </Panel>
      </div>
    );
  };
  
  export default Navbar;
  