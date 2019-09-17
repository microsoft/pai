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

import React, {useEffect, useState} from 'react';
import {Hint} from '../sidebar/hint';
import {DefaultButton, Dialog, DialogType, FontClassNames, FontSizes, Label, Separator, Stack, TextField} from 'office-ui-fabric-react';
import PropTypes from 'prop-types';
import c from 'classnames';
import t from '../../../components/tachyons.scss';
import {generateSSHKeyPair} from '../../utils/ssh-keygen';
import {isNil} from 'lodash';

export default function SSHGenerator({isOpen = false, hide, onSshKeysChange}) {
  const [sshKeys, setSshKeys] = useState();
  const [downloadedPriKey, setDownloadedPriKey] = useState(false);

  useEffect(() => {
    generateSshKeys(1024);
  }, []);

  useEffect(() => {
    setDownloadedPriKey(false);
  }, [sshKeys]);

  const generateSshKeys = (bits, ev=undefined) => {
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
    const blob = new Blob([content], {type: 'application/octet-stream,charset=UTF-8'});
    openDownloadDialog(blob, saveName);
  };

  const openDownloadDialog = (url, saveName) => {
      if (typeof url == 'object' && url instanceof Blob) {
          url = URL.createObjectURL(url);
      }
      let aLink = document.createElement('a');
      aLink.href = url;
      aLink.download = saveName || '';
      let event;
      if (window.MouseEvent) event = new MouseEvent('click');
      else {
          event = document.createEvent('MouseEvents');
          event.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
      }
      aLink.dispatchEvent(event);
  };

  return (
    <Dialog
      hidden={!isOpen}
      onDismiss={handleCancel}
      dialogContentProps={{
        type: DialogType.normal,
        styles: {
          title: {padding: '20px 36px 12px 20px'},
          inner: {padding: '0px 40px 20px 20px'},
          topButton: {padding: '20px 20px 0px 0px'},
        },
        title: (<span className={c(t.mb2, t.fw6, FontClassNames.semibold)} style={{fontSize: FontSizes.icon}}>SSH Generator</span>),
      }}
      minWidth={900}
      maxWidth={900}
      modalProps={{
        isBlocking: false,
        styles: {main: {maxWidth: 900}},
      }}
    >
      <Hint>
        Please download generated SSH private key then click Use to use this key pair in job.
        You can also download SSH public key for further use.
        Click Refresh SSH Keys to generate new SSH key pair.
      </Hint>
      <DefaultButton
        onClick={(ev) => generateSshKeys(1024, ev)}
      >
        Refresh SSH Keys
      </DefaultButton>
      <Stack horizontal tokens={{childrenGap: 50}} styles={{root: {width: 800}}}>
        <Stack tokens={{childrenGap: 10}} grow={1}>
          <TextField label='Public Key' multiline rows={20} disabled defaultValue={isNil(sshKeys) ? '' : sshKeys.public} />
          <DefaultButton
            onClick={(ev) => downloadAsFile(sshKeys.public, 'id_rsa_pai.pub', ev)}
          >
            Download Public Key
          </DefaultButton>
        </Stack>
        <Stack tokens={{childrenGap: 10}} grow={1}>
          <TextField label='Private Key' multiline rows={20} disabled defaultValue={isNil(sshKeys) ? '' : sshKeys.private} />
          <DefaultButton
            onClick={(ev) => {
              setDownloadedPriKey(true);
              downloadAsFile(sshKeys.private, 'id_rsa_pai', ev);
            }}
          >
            Download Private Key
          </DefaultButton>
        </Stack>
      </Stack>

      <Separator></Separator>
      <Stack horizontal horizontalAlign='space-evenly' tokens={{childrenGap: 150}} styles={{root: {width: 800}}}>
        <Stack.Item align='end'>
          {!downloadedPriKey &&
            <Label required={true}>
              Download new generated SSH private key before use!
            </Label>
          }
          <DefaultButton
            align='baseline'
            onClick={handleConfirm}
            disabled={!downloadedPriKey}
          >
            Use
          </DefaultButton>
        </Stack.Item>
        <Stack.Item align='end'>
          <DefaultButton
            onClick={handleCancel}
          >
            Cancel
          </DefaultButton>
        </Stack.Item>

      </Stack>
    </Dialog>
  );
}

SSHGenerator.propTypes = {
  isOpen: PropTypes.bool,
  hide: PropTypes.func,
  onSshKeysChange: PropTypes.func,
};

