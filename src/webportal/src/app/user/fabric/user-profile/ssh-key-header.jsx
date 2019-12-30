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

import React, { useState, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';

import c from 'classnames';
import { isEmpty } from 'lodash';
import { FontClassNames, FontWeights } from '@uifabric/styling';
import {
  DefaultButton,
  PrimaryButton,
  DialogType,
  Dialog,
  DialogFooter,
  TextField,
  Icon,
  TooltipHost,
} from 'office-ui-fabric-react';

import config from '../../../config/webportal.config';
import { checkSshKeyName, checkSshKeyValue } from '../utils';

import { ReactComponent as IconUser } from '../../../../assets/img/profile-user.svg';
import { ReactComponent as IconAdmin } from '../../../../assets/img/profile-admin.svg';
import t from '../../../components/tachyons.scss';

const SshKeyHeader = ({ onCreateSshCustomKey }) => {
  const [dialog, setDialog] = useState(0);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const sshKeyNameRef = useRef();
  const sshKeyValueRef = useRef();

  const onSaveSshKey = useCallback(() => {
    const sshKeyName = sshKeyNameRef.current && sshKeyNameRef.current.value;
    const sshKeyValue = sshKeyValueRef.current && sshKeyValueRef.current.value;
    let err;
    err = checkSshKeyName(sshKeyName);
    if (err) {
      setError(err);
      return;
    }
    err = checkSshKeyValue(sshKeyValue);
    if (err) {
      setError(err);
      return;
    }
    setProcessing(true);
    onCreateSshCustomKey({ sshKeyName, sshKeyValue }).finally(() => {
      setProcessing(false);
      setDialog(0);
    });
  });

  return (
     <div>
       <DefaultButton
         onClick={ () => setDialog(1) }
       >
         Add SSH Public Keys
      </DefaultButton>
      <Dialog
        hidden={dialog === 0}
        onDismiss={() => setDialog(0)}
        dialogContentProps={{
          type: DialogType.normal,
          title: 'Add an SSH Public Key',
        }}
        modalProps={{
          isBlocking: true,
        }}
        minWidth={600}
      >
        <div>
          <div className={t.mt1}>
            <TextField
              label='Name (Only A-Z, a-z, 0-9, - and _ are allowed):'
              componentRef={sshKeyNameRef}
            />
          </div>
          <div className={t.mt3}>
            <TextField
              label='SSH Public Key:'
              multiline
              rows={10}
              componentRef={sshKeyValueRef}
            />
          </div>
        </div>
        <DialogFooter>
          <PrimaryButton
            onClick={onSaveSshKey}
            disabled={processing}
            text='Save'
          />
          <DefaultButton
            onClick={() => setDialog(0)}
            disabled={processing}
            text='Cancel'
          />
        </DialogFooter>
      </Dialog>
      <Dialog
        hidden={isEmpty(error)}
        onDismiss={() => setError('')}
        dialogContentProps={{
          type: DialogType.normal,
          title: 'Error',
          subText: error,
        }}
        modalProps={{
          isBlocking: true,
        }}
      >
        <DialogFooter>
          <DefaultButton onClick={() => setError('')}>OK</DefaultButton>
        </DialogFooter>
      </Dialog>
    </div>
  )
}

export default SshKeyHeader;
