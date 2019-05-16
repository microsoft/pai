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
import {DetailsList, SelectionMode, FontClassNames, TooltipHost, TextField, Dropdown, DefaultButton} from 'office-ui-fabric-react';

import c from 'classnames';
import styled from 'styled-components';
import t from '../../../components/tachyons.scss';
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

  const DropdownDisabledDiv = styled.div`
    background-color: #ffffff;
    border: 1px solid #a6a6a6;
    margin-left: -12px;
    margin-right: -32px;
    padding-left: 12px;
  `;

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
      return (
        <Dropdown
          options={options}
          disabled={finished}
          defaultSelectedKey={String(toBool(admin))}
          onChange={(_event, option, _index) => {
            userInfo.admin = option.key;
          }}
          onRenderTitle={(options) => {
            const FixedDiv = finished ? DropdownDisabledDiv : styled.div``;
            const [{text}] = options;
            return (
              <FixedDiv>
                <span className={t.black}>{text}</span>
              </FixedDiv>
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
          displayText = <span className={c([t.black, t.h100])}>&nbsp;</span>;
        } else {
          let innerText = displayVCs[0];
          if (displayVCs.length > 1) {
            innerText = innerText + ` (+${displayVCs.length - 1})`;
          }
          displayText = <span className={c([t.black, t.h100])}>{innerText}</span>;
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
        return (
          <Dropdown
            disabled
            options={options}
            defaultSelectedKey={options[0].key}
            onRenderTitle={(_options) => {
              return (
                <DropdownDisabledDiv>
                  {getDisplayVirtualClusterString(userInfo['virtual cluster'])}
                </DropdownDisabledDiv>
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
  const githubPATColumn = {
    key: 'githubPAT',
    minWidth: 80,
    maxWidth: 200,
    name: 'Github PAT',
    className: FontClassNames.mediumPlus,
    headerClassName: FontClassNames.medium,
    isResizable: true,
    onRender: (userInfo) => {
      const {githubPAT} = userInfo;
      return (
        <TextField
          readOnly={isFinished(userInfo)}
          defaultValue={githubPAT}
          onChange={(_event, newValue) => {
            userInfo.githubPAT = newValue;
          }}
        />
      );
    },
  };
  githubPATColumn.onRender.displayName = 'onRenderGithubPATColumn';

  /**
   * @type {import('office-ui-fabric-react').IColumn}
   */
  const statusColumn = {
    key: 'status',
    minWidth: 100,
    maxWidth: 100,
    name: 'Status',
    className: c([FontClassNames.mediumPlus, t.pa0, t.flex, t.itemsCenter]),
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
            <StatusBadge status={statusText} />
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
      return (
        <div className={c([t.dib, t.vMid, t.w80])}>
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
    githubPATColumn,
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
