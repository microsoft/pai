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
import React, { useState } from 'react';
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

const SSHlist = ({ sshKeys, onDeleteSSHkeys }) => {
  const [processing, setProcessing] = useState(false);
  const [hideDeleteDialog, setHideDeleteDialog] = useState(true);
  const [deleteSSHItem, setDeleteSSHItem] = useState({});
  const sshList = sshKeys.sort((a, b) => b.time - a.time);
  const sshColumns = [
    {
      key: 'value',
      minWidth: 350,
      name: 'Value',
      isResizable: true,
      onRender(ssh) {
        return (
          <div className={c(t.flex, t.itemsCenter, t.h100)}>
            <div className={t.truncate}>{ssh.sshValue}</div>
            <CopyButton value={ssh.sshValue} />
          </div>
        );
      },
    },
    {
      key: 'title',
      minWidth: 212,
      name: 'Title',
      isResizable: true,
      onRender(ssh) {
        return (
          <div className={c(t.flex, t.itemsCenter, t.h100)}>{ssh.title}</div>
        );
      },
    },
    {
      key: 'time',
      minWidth: 214,
      maxWidth: 170,
      name: 'Created Time',
      isResizable: true,
      onRender(ssh) {
        return (
          <div className={c(t.flex, t.itemsCenter, t.h100)}>
            {new Date(ssh.time).toLocaleString()}
          </div>
        );
      },
    },
    {
      key: 'action',
      minWidth: 120,
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
              iconProps={{ iconName: 'Delete' }}
              text='Delete'
              onClick={() => {
                setHideDeleteDialog(false);
                setDeleteSSHItem(token);
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
        columns={sshColumns}
        disableSelectionZone
        items={sshList}
        layoutMode={DetailsListLayoutMode.justified}
        selectionMode={SelectionMode.none}
      />
      <Dialog
        hidden={hideDeleteDialog}
        onDismiss={() => setHideDeleteDialog(true)}
        dialogContentProps={{
          type: DialogType.normal,
          title: 'Delete SSH Public Keys',
        }}
        modalProps={{
          isBlocking: true,
        }}
        minWidth={400}
      >
        <div>Are you sure you want to delete this ssh key?</div>
        <DialogFooter>
          <PrimaryButton
            onClick={() => {
              setProcessing(true);
              onDeleteSSHkeys(deleteSSHItem).finally(() => {
                setHideDeleteDialog(true);
                setProcessing(false);
              });
            }}
            disabled={processing}
            text='Confirm'
          />
          <DefaultButton
            onClick={() => setHideDeleteDialog(true)}
            disabled={processing}
            text='Cancel'
          />
        </DialogFooter>
      </Dialog>
    </div>
  );
};

SSHlist.propTypes = {
  sshKeys: PropTypes.array,
  onDeleteSSHkeys: PropTypes.func.isRequired,
};

export default SSHlist;
