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

import c from 'classnames';
import copy from 'copy-to-clipboard';
import React, { useMemo, useState } from 'react';
import jwt from 'jsonwebtoken';
import cookies from 'js-cookie';
import PropTypes from 'prop-types';
import {
  DetailsList,
  DetailsListLayoutMode,
  SelectionMode,
  IconButton,
  FontSizes,
  CommandBarButton,
} from 'office-ui-fabric-react';

import t from '../../../components/tachyons.scss';

const TokenList = ({ tokens, onRevoke }) => {
  const [processing, setProcessing] = useState(false);

  const tokenItems = useMemo(() => {
    return tokens
      .map(x => ({
        ...jwt.decode(x),
        value: x,
      }))
      .sort((a, b) => b.iat - a.iat);
  }, [tokens]);

  const tokenColumns = [
    {
      key: 'value',
      minWidth: 120,
      name: 'Value',
      isResizable: true,
      onRender(token) {
        return (
          <div className={c(t.flex, t.itemsCenter, t.h100)}>
            <div className={t.truncate}>{token.value}</div>
            <div>
              <IconButton
                iconProps={{ iconName: 'Copy' }}
                styles={{ icon: [{ fontSize: FontSizes.small }] }}
                onClick={() => copy(token.value)}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: 'iat',
      minWidth: 150,
      maxWidth: 150,
      name: 'Issued At',
      isResizable: true,
      onRender(token) {
        return (
          <div className={c(t.flex, t.itemsCenter, t.h100)}>
            {new Date(token.iat * 1000).toLocaleString()}
          </div>
        );
      },
    },
    {
      key: 'exp',
      minWidth: 150,
      maxWidth: 150,
      name: 'Expiration Time',
      isResizable: true,
      onRender(token) {
        return (
          <div className={c(t.flex, t.itemsCenter, t.h100)}>
            {token.exp && new Date(token.exp * 1000).toLocaleString()}
          </div>
        );
      },
    },
    {
      key: 'type',
      minWidth: 150,
      name: 'Token Type',
      isResizable: true,
      onRender(token) {
        return (
          <div className={c(t.flex, t.itemsCenter, t.h100)}>
            {token.application
              ? 'Application'
              : token.value === cookies.get('token')
              ? 'Browser (Current)'
              : 'Browser'}
          </div>
        );
      },
    },
    {
      key: 'action',
      minWidth: 100,
      name: 'Action',
      isResizable: true,
      onRender(token) {
        return (
          <div className={c(t.flex, t.itemsCenter, t.h100)}>
            <CommandBarButton
              styles={{
                root: { backgroundColor: 'transparent', height: '100%' },
                rootDisabled: { backgroundColor: 'transparent' },
              }}
              iconProps={{ iconName: 'CommandPrompt' }}
              text='Revoke'
              onClick={() => {
                setProcessing(true);
                onRevoke(token.value).finally(() => setProcessing(false));
              }}
              disabled={processing}
            />
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <DetailsList
        columns={tokenColumns}
        disableSelectionZone
        items={tokenItems}
        layoutMode={DetailsListLayoutMode.justified}
        selectionMode={SelectionMode.none}
      />
    </div>
  );
};

TokenList.defaultProps = {
  tokens: [],
};

TokenList.propTypes = {
  tokens: PropTypes.arrayOf(PropTypes.string),
  onRevoke: PropTypes.func.isRequired,
};

export default TokenList;
