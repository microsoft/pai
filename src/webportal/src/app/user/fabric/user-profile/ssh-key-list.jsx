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
import React, { useMemo, useState } from 'react';
import cookies from 'js-cookie';
import PropTypes from 'prop-types';
import {
  DetailsList,
  DetailsListLayoutMode,
  SelectionMode,
  CommandBarButton,
  DialogType,
  Dialog,
  DialogFooter,
  PrimaryButton,
  DefaultButton,
} from 'office-ui-fabric-react';

import t from '../../../components/tachyons.scss';
import CopyButton from '../../../components/copy-button';

const SshKeyList = ({ sshKeys, onRevoke }) => {
  const [processing, setProcessing] = useState(false);
  const [revokeSshKey, setRevokeSshKey] = useState(null);

  const sshKeyItems = useMemo(() => {
    return sshKeys
      .sort((a, b) => b['updated-at'] - a['updated-at']);
  }, [sshKeys]);

  const sshKeyColumns = [
    {
      key: 'name',
      maxWidth: 50,
      name: 'Name',
      isResizable: true,
      onRender(item) {
        return (
          <div className={c(t.flex, t.itemsCenter, t.h100)}>
            <div className={t.truncate}>{item.name}</div>
          </div>
        );
      },
    },
    {
      key: 'publick-key',
      minWidth: 120,
      name: 'Value',
      isResizable: true,
      onRender(item) {
        return (
          <div className={c(t.flex, t.itemsCenter, t.h100)}>
            <div className={t.truncate}>{item['public-key']}</div>
            <CopyButton value={item['public-key']} />
          </div>
        );
      },
    },
    {
      key: 'updated-at',
      minWidth: 150,
      maxWidth: 150,
      name: 'Updated At',
      isResizable: true,
      onRender(item) {
        return (
          <div className={c(t.flex, t.itemsCenter, t.h100)}>
            {new Date(item['updated-at']).toLocaleString()}
          </div>
        );
      },
    },
    {
      key: 'action',
      minWidth: 100,
      name: 'Action',
      isResizable: true,
      onRender(item) {
        return (
          <div className={c(t.flex, t.itemsCenter, t.h100)}>
            <CommandBarButton
              styles={{
                root: { backgroundColor: 'transparent', height: '100%' },
                rootDisabled: { backgroundColor: 'transparent' },
              }}
              iconProps={{ iconName: 'Delete' }}
              text='Revoke'
              onClick={() => setRevokeSshKey(item.name)}
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
        columns={sshKeyColumns}
        disableSelectionZone
        items={sshKeyItems}
        layoutMode={DetailsListLayoutMode.justified}
        selectionMode={SelectionMode.none}
      />
      <Dialog
        hidden={!revokeSshKey}
        onDismiss={() => setRevokeSshKey(null)}
        dialogContentProps={{
          type: DialogType.normal,
          title: 'Revoke SSH Key',
        }}
        modalProps={{
          isBlocking: true,
        }}
        minWidth={400}
      >
        <div>Are you sure you want to revoke the selected SSH key?</div>
        <DialogFooter>
          <PrimaryButton
            onClick={() => {
              setProcessing(true);
              onRevoke(revokeSshKey).finally(() => {
                setRevokeSshKey(null);
                setProcessing(false);
              });
            }}
            disabled={processing}
            text='Confirm'
          />
          <DefaultButton
            onClick={() => setRevokeSshKey(null)}
            disabled={processing}
            text='Cancel'
          />
        </DialogFooter>
      </Dialog>
    </div>
  );
};

SshKeyList.defaultProps = {
  sshKeys: [],
};

export default SshKeyList;
