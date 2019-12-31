import React, { useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import {
  Dialog,
  DialogType,
  DialogFooter,
  PrimaryButton,
  DefaultButton,
} from 'office-ui-fabric-react';
import { getTheme } from '@uifabric/styling';
import { isNil } from 'lodash';

import SuccessJobList from './components/success-job-list';

const SuccessJobsDialog = () => {
  const { spacing } = getTheme();

  const [hideDialog, setHideDialog] = useState(false);
  const closeDialog = useCallback(() => {
    setHideDialog(true);
  }, []);

  const onConfirm = useCallback(() => {}, []);

  return (
    <Dialog
      hidden={hideDialog}
      onDismiss={closeDialog}
      minWidth={800}
      dialogContentProps={{
        type: DialogType.normal,
        showCloseButton: false,
      }}
      modalProps={{
        isBlocking: true,
      }}
    >
      <SuccessJobList />
      <DialogFooter>
        <PrimaryButton onClick={onConfirm} text='Confirm' />
        <DefaultButton onClick={closeDialog} text='Cancel' />
      </DialogFooter>
    </Dialog>
  );
};

const contentWrapper = document.getElementById('content-wrapper');
ReactDOM.render(<SuccessJobsDialog />, contentWrapper);
