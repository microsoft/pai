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

import t from '../../../components/tachyons.scss';

const SSHListDialog = ({ onDismiss, onAddPublickeys }) => {
  const [error, setError] = useState('');
  const [inputTitleError, setInputTitleError] = useState('');
  const [inputValueError, setInputValueError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [title, setTitle] = useState('');
  const [sshValue, setValue] = useState('');

  const onAddAsync = async () => {
    if (title.trim() === '') {
      setInputTitleError('Please input title');
    } else if (sshValue.trim() === '') {
      setInputValueError('Please input ssk value');
    } else {
      setProcessing(true);
      try {
        await onAddPublickeys({
          title: title.trim(),
          sshValue: sshValue.trim(),
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
              label='title'
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
              label='value'
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
  onDismiss: PropTypes.func.isRequired,
  onAddPublickeys: PropTypes.func.isRequired,
};

export default SSHListDialog;
