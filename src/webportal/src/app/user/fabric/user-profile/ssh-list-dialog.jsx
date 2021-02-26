// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { isEmpty } from 'lodash';
import {
  DefaultButton,
  PrimaryButton,
  DialogType,
  Dialog,
  DialogFooter,
  TextField,
} from 'office-ui-fabric-react';
import sshpk from 'sshpk';

import t from '../../../components/tachyons.scss';

const validateSSHPublicKey = keyString => {
  try {
    const key = sshpk.parseKey(keyString, 'ssh');
    if (sshpk.Key.isKey(key)) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
};

const SSHListDialog = ({ sshKeys, onDismiss, onAddPublickeys }) => {
  const [error, setError] = useState('');
  const [inputTitleError, setInputTitleError] = useState('');
  const [inputValueError, setInputValueError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [title, setTitle] = useState('');
  const [value, setValue] = useState('');

  const onAddAsync = async () => {
    let surefireTitle = false;
    let surefireValue = false;

    if (title.trim() === '') {
      setInputTitleError('Please input title');
    } else if (
      sshKeys !== undefined &&
      sshKeys.filter(item => item.title === title.trim()).length > 0
    ) {
      setInputTitleError('This title already exists, please re-input');
    } else {
      surefireTitle = true;
    }
    if (value.trim() === '' || !validateSSHPublicKey(value.trim())) {
      setInputValueError('Please input correct SSH Public key.');
    } else {
      surefireValue = true;
    }
    if (surefireTitle && surefireValue) {
      setProcessing(true);
      try {
        await onAddPublickeys({
          title: title.trim(),
          value: value.trim(),
          time: new Date().getTime(),
        });
      } catch (error) {
        setError(error.message);
      } finally {
        setProcessing(false);
        onDismiss();
      }
    }
  };

  return (
    <div>
      <Dialog
        hidden={false}
        onDismiss={onDismiss}
        dialogContentProps={{
          type: DialogType.normal,
          title: 'Add SSH Public Keys',
        }}
        modalProps={{
          isBlocking: true,
        }}
        minWidth={600}
      >
        <div>
          <div className={t.mt1}>
            <TextField
              label='Title (Please give the SSH public key a name):'
              required={true}
              errorMessage={inputTitleError}
              onChange={e => {
                setTitle(e.target.value);
                setInputTitleError(null);
              }}
              validateOnFocusOut={true}
            />
          </div>
          <div className={t.mt1}>
            <TextField
              label='SSH public key:'
              required={true}
              errorMessage={inputValueError}
              onChange={e => {
                setValue(e.target.value);
                setInputValueError(null);
              }}
              multiline
              rows={5}
              validateOnFocusOut={true}
            />
          </div>
        </div>
        <DialogFooter>
          <PrimaryButton
            onClick={onAddAsync}
            disabled={processing}
            text='Add'
          />
          <DefaultButton
            onClick={onDismiss}
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
  );
};

SSHListDialog.propTypes = {
  sshKeys: PropTypes.array.isRequired,
  onDismiss: PropTypes.func.isRequired,
  onAddPublickeys: PropTypes.func.isRequired,
};

export default SSHListDialog;
