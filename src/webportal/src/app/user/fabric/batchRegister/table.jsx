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
import {MessageBar, MessageBarType, DetailsList, SelectionMode, FontClassNames, TooltipHost} from 'office-ui-fabric-react';

import Context from './context';
import {toBool} from './utils';

const zeroPaddingRowFieldStyle = {
  marginTop: -11,
  marginBottom: -11,
  marginLeft: -12,
  marginRight: -8,
};

export default function Table() {
  const {userInfos} = useContext(Context);

  /**
   * @type {import('office-ui-fabric-react').IColumn}
   */
  const usernameColumn = {
    key: 'username',
    minWidth: 100,
    maxWidth: 600,
    name: 'User Name',
    fieldName: 'username',
    className: FontClassNames.mediumPlus,
    headerClassName: FontClassNames.medium,
    isResizable: true,
  };

  /**
   * @type {import('office-ui-fabric-react').IColumn}
   */
  const passwordColumn = {
    key: 'password',
    minWidth: 80,
    maxWidth: 200,
    name: 'Password',
    fieldName: 'password',
    className: FontClassNames.mediumPlus,
    headerClassName: FontClassNames.medium,
    isResizable: true,
  };

  /**
   * @type {import('office-ui-fabric-react').IColumn}
   */
  const adminColumn = {
    key: 'admin',
    minWidth: 60,
    maxWidth: 200,
    name: 'Admin',
    fieldName: 'admin',
    className: FontClassNames.mediumPlus,
    headerClassName: FontClassNames.medium,
    isResizable: true,
    onRender: ({admin}) => {
      return toBool(admin) ? 'Yes' : 'No';
    },
  };

  /**
   * @type {import('office-ui-fabric-react').IColumn}
   */
  const virtualClusterColumn = {
    key: 'virtual cluster',
    minWidth: 100,
    maxWidth: 300,
    name: 'Virtual Cluster',
    fieldName: 'virtual cluster',
    className: FontClassNames.mediumPlus,
    headerClassName: FontClassNames.medium,
    isResizable: true,
  };

  /**
   * @type {import('office-ui-fabric-react').IColumn}
   */
  const githubPATColumn = {
    key: 'githubPAT',
    minWidth: 80,
    maxWidth: 200,
    name: 'Github PAT',
    fieldName: 'githubPAT',
    className: FontClassNames.mediumPlus,
    headerClassName: FontClassNames.medium,
    isResizable: true,
  };

  /**
   * @type {import('office-ui-fabric-react').IColumn}
   */
  const statusColumn = {
    key: 'status',
    minWidth: 100,
    maxWidth: 100,
    name: 'Status',
    fieldName: 'status',
    className: FontClassNames.mediumPlus,
    headerClassName: FontClassNames.medium,
    isResizable: true,

    onRender(userInfo) {
      const {status: {isSuccess, message} = {}} = userInfo;

      /** @type {React.CSSProperties} */
      const wrapperStyle = {display: 'inline-block', verticalAlign: 'middle', width: '100%'};
      let statusText = undefined;
      if (isSuccess === true) {
        statusText = 'Succeeded';
      } else if (isSuccess === false) {
        statusText = 'Failed';
      } else {
        return undefined;
      }
      /** @type {MessageBarType} */
      const messageBarType = {
        Succeeded: MessageBarType.success,
        Failed: MessageBarType.remove,
      }[statusText];
      const rootStyle = {
        backgroundColor: {
          Succeeded: '#7FBA00',
          Failed: '#E81123',
        }[statusText],
      };
      /** @type {import('@uifabric/styling').IStyle} */
      const iconContainerStyle = {marginTop: 8, marginBottom: 8, marginLeft: 8};
      /** @type {import('@uifabric/styling').IStyle} */
      const iconStyle = {color: 'white'};
      /** @type {import('@uifabric/styling').IStyle} */
      const textStyle = {marginTop: 8, marginRight: 8, marginBottom: 8, color: 'white'};
      return (
        <div style={Object.assign(wrapperStyle, zeroPaddingRowFieldStyle)}>
          <TooltipHost content={message}>
            <MessageBar
              messageBarType={messageBarType}
              styles={{root: rootStyle, iconContainer: iconContainerStyle, icon: iconStyle, text: textStyle}}
            >
              {statusText}
            </MessageBar>
          </TooltipHost>
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
  ];

  return (
    <DetailsList
      items={userInfos}
      selectionMode={SelectionMode.none}
      columns={columns}
    />
  );
}
