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

import React, { useEffect, useState } from 'react';
import { Hint } from '../sidebar/hint';
import {
  DefaultButton,
  Dialog,
  DialogType,
  FontClassNames,
  FontSizes,
  Label,
  Separator,
  Stack,
  TextField,
} from 'office-ui-fabric-react';
import PropTypes from 'prop-types';
import c from 'classnames';
import t from '../../../components/tachyons.scss';
import { generateSSHKeyPair } from '../../utils/ssh-keygen';
import { isNil } from 'lodash';

export default function SSHGenerator({
  isOpen = false,
  bits = 1024,
  hide,
  onSshKeysChange,
}) {
  const [sshKeys, setSshKeys] = useState();
  const [downloadedPriKey, setDownloadedPriKey] = useState(false);

  useEffect(() => {
    generateSshKeys(bits);
  }, []);

  useEffect(() => {
    setDownloadedPriKey(false);
  }, [sshKeys]);

  const generateSshKeys = (bits, ev = undefined) => {
    const keys = generateSSHKeyPair(bits);
    setSshKeys(keys);
  };

  const handleCancel = () => {
    hide();
  };

  const handleConfirm = () => {
    onSshKeysChange(sshKeys);
    hide();
  };

  const downloadAsFile = (content, saveName, ev) => {
    const blob = new Blob([content], {
      type: 'application/octet-stream,charset=UTF-8',
    });
    openDownloadDialog(blob, saveName);
  };

  const openDownloadDialog = (url, saveName) => {
    if (typeof url === 'object' && url instanceof Blob) {
      url = URL.createObjectURL(url);
    }
    const aLink = document.createElement('a');
    aLink.href = url;
    aLink.download = saveName || '';
    aLink.click();
  };

  return (
    <Dialog
      hidden={!isOpen}
      onDismiss={handleCancel}
      dialogContentProps={{
        type: DialogType.normal,
        title: (
          <span
            className={c(t.mb2, t.fw6, FontClassNames.semibold)}
            style={{ fontSize: FontSizes.icon }}
          >
            SSH Key Generator
          </span>
        ),
      }}
      minWidth={900}
      maxWidth={900}
      modalProps={{
        isBlocking: false,
        styles: { main: { maxWidth: 900 } },
      }}
    >
      <Hint>
        Please download SSH private key then click <b>Use Public Key</b> button
        to use this key pair in job. Then after job submitted, you can ssh to
        job containers as user root with the downloaded private key through
        container ip and ssh port. Try using{' '}
        <code>
          {'ssh -i <private key path> -p <ssh port> root@<container ip>'}
        </code>{' '}
        to ssh to job container.
      </Hint>

      <Separator>SSH key pair</Separator>

      <Stack horizontal padding='l1' gap='l1' styles={{ root: { width: 860 } }}>
        <Stack padding='s1' gap='s1' grow={1}>
          <TextField
            label='Private Key'
            multiline
            rows={20}
            readonly
            resizable={false}
            defaultValue={isNil(sshKeys) ? '' : sshKeys.private}
          />
          <DefaultButton
            onClick={ev => {
              setDownloadedPriKey(true);
              downloadAsFile(sshKeys.private, 'id_rsa_pai', ev);
            }}
          >
            Download Private Key
          </DefaultButton>
        </Stack>
        <Stack padding='s1' gap='s1' grow={1}>
          <TextField
            label='Public Key'
            multiline
            rows={20}
            readonly
            resizable={false}
            defaultValue={isNil(sshKeys) ? '' : sshKeys.public}
          />
          <DefaultButton
            onClick={ev => downloadAsFile(sshKeys.public, 'id_rsa_pai.pub', ev)}
          >
            Download Public Key
          </DefaultButton>
        </Stack>
      </Stack>

      <Separator></Separator>

      <Stack
        horizontal
        horizontalAlign='space-evenly'
        padding='l1'
        gap='l1'
        styles={{ root: { width: 860 } }}
      >
        <Stack.Item align='end'>
          {!downloadedPriKey && (
            <Label required={true}>
              Download private key before use ssh keys in job!
            </Label>
          )}
          <DefaultButton
            align='baseline'
            onClick={handleConfirm}
            disabled={!downloadedPriKey}
          >
            Use Public Key
          </DefaultButton>
        </Stack.Item>
        <Stack.Item align='end'>
          <DefaultButton onClick={handleCancel}>Cancel</DefaultButton>
        </Stack.Item>
      </Stack>
    </Dialog>
  );
}

SSHGenerator.propTypes = {
  isOpen: PropTypes.bool,
  bits: PropTypes.number,
  hide: PropTypes.func,
  onSshKeysChange: PropTypes.func,
};
