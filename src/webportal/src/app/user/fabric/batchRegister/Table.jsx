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

import React, {useContext} from 'react';
import {DetailsList, SelectionMode, FontClassNames, TooltipHost, Dropdown, DefaultButton} from 'office-ui-fabric-react';

import {StatusBadge} from '../../../components/status-badge';

import TableTextField from './TableTextField';
import Context from './Context';
import {toBool, isFinished, checkUsername, checkPassword} from './utils';

export default function Table() {
  const {userInfos, virtualClusters, removeRow, allUsers} = useContext(Context);

  /**
   * @type {import('office-ui-fabric-react').IColumn}
   */
  const usernameColumn = {
    key: 'username',
    minWidth: 120,
    maxWidth: 600,
    name: 'User Name',
    className: FontClassNames.mediumPlus,
    headerClassName: FontClassNames.medium,
    isResizable: true,
    onRender: (userInfo) => {
      const {username} = userInfo;
      const getErrorMessage = (value) => {
        let errorMessage = checkUsername(value);
        if (errorMessage) {
          return errorMessage;
        }
        if (allUsers.indexOf(value) != -1) {
          return 'User name already exists';
        }
        return '';
      };
      return (
        <TableTextField
          readOnly={isFinished(userInfo)}
          defaultValue={username}
          onChange={(_event, newValue) => {
            userInfo.username = newValue;
          }}
          onGetErrorMessage={getErrorMessage}
        />
      );
    },
  };

  /**
   * @type {import('office-ui-fabric-react').IColumn}
   */
  const passwordColumn = {
    key: 'password',
    minWidth: 120,
    maxWidth: 200,
    name: 'Password',
    className: FontClassNames.mediumPlus,
    headerClassName: FontClassNames.medium,
    isResizable: true,
    onRender: (userInfo) => {
      const {password} = userInfo;
      const getErrorMessage = (value) => {
        return checkPassword(value);
      };
      return (
        <TableTextField
          readOnly={isFinished(userInfo)}
          defaultValue={password}
          onChange={(_event, newValue) => {
            userInfo.password = newValue;
          }}
          onGetErrorMessage={getErrorMessage}
        />
      );
    },
  };

  /**
   * @type {import('office-ui-fabric-react').IColumn}
   */
  const adminColumn = {
    key: 'admin',
    minWidth: 80,
    maxWidth: 200,
    name: 'Admin',
    className: FontClassNames.mediumPlus,
    headerClassName: FontClassNames.medium,
    isResizable: true,
    onRender: (userInfo) => {
      /**
       * @type {import('office-ui-fabric-react').IDropdownOption[]}
       */
      const options = [
        {key: 'true', text: 'Yes'},
        {key: 'false', text: 'No'},
      ];
      const {admin} = userInfo;
      const finished = isFinished(userInfo);
      /** @type {import('@uifabric/styling').IStyle} */
      const disableStyle = {backgroundColor: '#ffffff', border: '1px solid #a6a6a6', marginLeft: -12, marginRight: -32, paddingLeft: 12};
      return (
        <Dropdown
          options={options}
          disabled={finished}
          defaultSelectedKey={String(toBool(admin))}
          onChange={(_event, option, _index) => {
            userInfo.admin = option.key;
          }}
          onRenderTitle={(options) => {
            const fixStyle = finished ? disableStyle : null;
            const [{text}] = options;
            return (
              <div style={fixStyle}>
                <span style={{color: '#000000'}}>{text}</span>
              </div>
            );
          }}
        />
      );
    },
  };

  /**
   * @type {import('office-ui-fabric-react').IColumn}
   */
  const virtualClusterColumn = {
    key: 'virtual cluster',
    minWidth: 150,
    maxWidth: 300,
    name: 'Virtual Cluster',
    className: FontClassNames.mediumPlus,
    headerClassName: FontClassNames.medium,
    isResizable: true,
    onRender: (userInfo) => {
      /**
       * @type {import('office-ui-fabric-react').IDropdownOption[]}
       */
      const options = virtualClusters.map((vc) => {
        return {key: vc, text: vc};
      });
      const parseVirtualClusterString = (virtualClusterString) => {
        if (virtualClusterString) {
          return virtualClusterString.split(',').map((vc) => vc.trim()).sort();
        } else {
          return [];
        }
      };
      const getDisplayVirtualClusterString = (virtualClusterString) => {
        const displayVCs = parseVirtualClusterString(virtualClusterString);
        let displayText;
        if (displayVCs.length == 0) {
          displayText = <span style={{color: '#000000', height: '100%'}}>&nbsp;</span>;
        } else {
          let innerText = displayVCs[0];
          if (displayVCs.length > 1) {
            innerText = innerText + ` (+${displayVCs.length - 1})`;
          }
          displayText = <span style={{color: '#000000', height: '100%'}}>{innerText}</span>;
        }
        return displayText;
      };
      let vcs = [];
      const parsedVCs = parseVirtualClusterString(userInfo['virtual cluster']);
      parsedVCs.forEach((vc) => {
        if (vc) {
          if (virtualClusters.indexOf(vc) != -1) {
            vcs.push(vc);
          }
        }
      });
      const finished = isFinished(userInfo);
      if (finished) {
        /** @type {import('@uifabric/styling').IStyle} */
        const disableStyle = {backgroundColor: '#ffffff', border: '1px solid #a6a6a6', marginLeft: -12, marginRight: -32, paddingLeft: 12};
        return (
          <Dropdown
            disabled
            options={options}
            defaultSelectedKey={options[0].key}
            onRenderTitle={(_options) => {
              return (
                <div style={disableStyle}>
                  {getDisplayVirtualClusterString(userInfo['virtual cluster'])}
                </div>
              );
            }}
          />
        );
      } else {
        return (
          <Dropdown
            multiSelect
            options={options}
            defaultSelectedKeys={vcs}
            onChange={(_event, option, _index) => {
              if (option.selected) {
                vcs.push(option.text);
              } else {
                vcs.splice(vcs.indexOf(option.text), 1);
              }
              userInfo['virtual cluster'] = vcs.join(',');
            }}
            onRenderTitle={(_options) => {
              return (
                <div>
                  {getDisplayVirtualClusterString(userInfo['virtual cluster'])}
                </div>
              );
            }}
          />
        );
      }
    },
  };

  /**
   * @type {import('office-ui-fabric-react').IColumn}
   */
  const statusColumn = {
    key: 'status',
    minWidth: 100,
    maxWidth: 100,
    name: 'Status',
    className: FontClassNames.mediumPlus,
    headerClassName: FontClassNames.medium,
    isResizable: true,

    onRender(userInfo) {
      const {status: {isSuccess, message} = {}} = userInfo;
      let statusText = undefined;
      if (isSuccess === true) {
        statusText = 'Succeeded';
      } else if (isSuccess === false) {
        statusText = 'Failed';
      } else {
        return undefined;
      }
      return (
        <TooltipHost content={message}>
          <div style={{marginTop: '0.5rem'}}>
            <StatusBadge status={statusText} />
          </div>
        </TooltipHost>
      );
    },
  };

  /**
   * @type {import('office-ui-fabric-react').IColumn}
   */
  const actionColumn = {
    key: 'action',
    minWidth: 100,
    name: 'Action',
    headerClassName: FontClassNames.medium,
    onRender(userInfo) {
      /**
       * @param {React.MouseEvent} event
       */
      function onClick(event) {
        event.stopPropagation();
        removeRow(userInfo);
      }
      /** @type {React.CSSProperties} */
      const wrapperStyle = {display: 'inline-block', verticalAlign: 'middle', width: '80%'};
      return (
        <div style={wrapperStyle}>
          <DefaultButton
            onClick={onClick}
          >
            Remove
          </DefaultButton>
        </div>
      );
    },
  };

  const columns = [
    usernameColumn,
    statusColumn,
    passwordColumn,
    adminColumn,
    virtualClusterColumn,
    actionColumn,
  ];

  return (
    <DetailsList
      items={userInfos}
      selectionMode={SelectionMode.none}
      columns={columns}
    />
  );
}
