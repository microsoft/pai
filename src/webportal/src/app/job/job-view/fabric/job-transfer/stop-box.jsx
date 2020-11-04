// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import {
  Stack,
  Text,
  Dialog,
  DialogFooter,
  PrimaryButton,
  DefaultButton,
} from 'office-ui-fabric-react';
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import qs from 'querystring';
import { stopJob } from './conn';
import { Spinner, SpinnerSize } from 'office-ui-fabric-react/lib/Spinner';

function StopBox({ hidden, userName, jobName, jobState, onDismiss }) {
  const [isStopping, setIsStopping] = useState(false);

  const redirectToJobDetail = () => {
    window.location.href = `/job-detail.html?${qs.stringify({
      username: userName,
      jobName: jobName,
    })}`;
  };

  const onClickStop = () => {
    (async () => {
      setIsStopping(true);
      await stopJob(userName, jobName);
    })()
      .then(() => {
        setIsStopping(false);
        onDismiss();
        redirectToJobDetail();
      })
      .catch(err => {
        setIsStopping(false);
        alert(`An error happens during job stopping. Details: ${err.message}`);
      });
  };

  const onClickKeep = () => {
    onDismiss();
    redirectToJobDetail();
  };

  return (
    <Dialog
      hidden={hidden}
      modalProps={{
        isBlocking: true,
      }}
    >
      <Stack gap='m'>
        <Text variant='xLarge'>Notice</Text>
        <Text variant='large'>
          Your job has been successfully transferred! Now, your job on this
          cluster is in status {jobState}. Would you like to stop it?
        </Text>
      </Stack>
      <DialogFooter>
        <Stack gap={20} horizontal={true} horizontalAlign='end'>
          {isStopping && <Spinner size={SpinnerSize.medium} />}
          <PrimaryButton disabled={isStopping} onClick={onClickStop}>
            Stop it
          </PrimaryButton>
          <DefaultButton disabled={isStopping} onClick={onClickKeep}>
            Keep it
          </DefaultButton>
        </Stack>
      </DialogFooter>
    </Dialog>
  );
}

StopBox.propTypes = {
  hidden: PropTypes.bool.isRequired,
  userName: PropTypes.string.isRequired,
  jobName: PropTypes.string.isRequired,
  jobState: PropTypes.string.isRequired,
  onDismiss: PropTypes.func.isRequired,
};

export default StopBox;
