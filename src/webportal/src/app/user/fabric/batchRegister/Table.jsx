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

import React, { useContext } from 'react';
import {
  DetailsList,
  SelectionMode,
  FontClassNames,
  TooltipHost,
  Dropdown,
  DefaultButton,
} from 'office-ui-fabric-react';

import c from 'classnames';
import t from '../../../components/tachyons.scss';
import { StatusBadge } from '../../../components/status-badge';

import TableTextField from './TableTextField';
import Context from './Context';
import { toBool, isFinished } from './utils';
import { checkUsername, checkPassword, checkEmail } from '../utils';

export default function Table() {
  const { userInfos, virtualClusters, removeRow, allUsers } = useContext(
    Context,
  );

  /**
   * username column
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
    onRender: userInfo => {
      const { username } = userInfo;
      const getErrorMessage = value => {
        const errorMessage = checkUsername(value);
        if (errorMessage) {
          return errorMessage;
        }
        if (allUsers.indexOf(value) !== -1) {
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
   * password column
   * @type {import('office-ui-fabric-react').IColumn}
   */
  const passwordColumn = {
    key: 'password',
    minWidth: 150,
    maxWidth: 200,
    name: 'Password',
    className: FontClassNames.mediumPlus,
    headerClassName: FontClassNames.medium,
    isResizable: true,
    onRender: userInfo => {
      const { password } = userInfo;
      const getErrorMessage = value => {
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
          customPasswordStyle={true}
        />
      );
    },
  };

  /**
   * email column
   * @type {import('office-ui-fabric-react').IColumn}
   */
  const emailColumn = {
    key: 'email',
    minWidth: 150,
    maxWidth: 300,
    name: 'Email',
    className: FontClassNames.mediumPlus,
    headerClassName: FontClassNames.medium,
    isResizable: true,
    onRender: userInfo => {
      const { email } = userInfo;
      const getErrorMessage = value => {
        return checkEmail(value);
      };
      return (
        <TableTextField
          readOnly={isFinished(userInfo)}
          defaultValue={email}
          onChange={(_event, newValue) => {
            userInfo.email = newValue;
          }}
          onGetErrorMessage={getErrorMessage}
        />
      );
    },
  };

  emailColumn.onRender.displayName = 'onRenderEmailColumn';

  const dropdownTitleStyle = [t.bgWhite, { border: '1px solid #a6a6a6' }];

  /**
   * admin column
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
    onRender: userInfo => {
      /**
       * @type {import('office-ui-fabric-react').IDropdownOption[]}
       */
      const options = [
        { key: 'true', text: 'Yes' },
        { key: 'false', text: 'No' },
      ];
      const { admin } = userInfo;
      const finished = isFinished(userInfo);
      return (
        <Dropdown
          options={options}
          disabled={finished}
          styles={{ title: dropdownTitleStyle }}
          defaultSelectedKey={String(toBool(admin))}
          onChange={(_event, option, _index) => {
            userInfo.admin = option.key;
          }}
          onRenderTitle={options => {
            const [{ text }] = options;
            return <span className={t.black}>{text}</span>;
          }}
        />
      );
    },
  };

  /**
   * virtual cluster column
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
    onRender: userInfo => {
      /**
       * @type {import('office-ui-fabric-react').IDropdownOption[]}
       */
      const options = virtualClusters.map(vc => {
        return { key: vc, text: vc };
      });
      const finished = isFinished(userInfo);
      return (
        <Dropdown
          disabled={finished}
          styles={{ title: dropdownTitleStyle }}
          multiSelect
          options={options}
          defaultSelectedKeys={userInfo.vcs}
          onChange={(_event, option, _index) => {
            if (option.selected) {
              userInfo.vcs.push(option.text);
            } else {
              userInfo.vcs.splice(userInfo.vcs.indexOf(option.text), 1);
            }
          }}
          onRenderTitle={_options => {
            if (userInfo.vcs.length === 0) {
              return null;
            } else {
              let innerText = userInfo.vcs[0];
              if (userInfo.vcs.length > 1) {
                innerText = innerText + ` (+${userInfo.vcs.length - 1})`;
              }
              return <span className={t.black}>{innerText}</span>;
            }
          }}
        />
      );
    },
  };

  virtualClusterColumn.onRender.displayName = 'onRenderVirtualClusterColumn';

  /**
   * status column
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
      const { status: { isSuccess, message } = {} } = userInfo;
      let statusText;
      if (isSuccess === true) {
        statusText = 'Succeeded';
      } else if (isSuccess === false) {
        statusText = 'Failed';
      } else {
        return undefined;
      }
      return (
        <div className={c(t.flex, t.itemsCenter, t.h100)}>
          <TooltipHost content={message}>
            <StatusBadge status={statusText} />
          </TooltipHost>
        </div>
      );
    },
  };

  /**
   * action column
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
        <DefaultButton
          onClick={onClick}
          styles={{
            root: { backgroundColor: '#e5e5e5' },
            rootFocused: { backgroundColor: '#e5e5e5' },
            rootDisabled: { backgroundColor: '#eeeeee' },
            rootCheckedDisabled: { backgroundColor: '#eeeeee' },
          }}
        >
          Remove
        </DefaultButton>
      );
    },
  };

  const columns = [
    usernameColumn,
    statusColumn,
    passwordColumn,
    emailColumn,
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
