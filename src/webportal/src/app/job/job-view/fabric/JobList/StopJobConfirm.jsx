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
import React, {useContext} from 'react';
import {DefaultButton, PrimaryButton} from 'office-ui-fabric-react';
import {Dialog, DialogFooter} from 'office-ui-fabric-react/lib/Dialog';
import {Icon} from 'office-ui-fabric-react/lib/Icon';
import {getStatusText} from './utils';
import PropTypes from 'prop-types';
import Context from './Context';
import t from '../../../../components/tachyons.scss';
import c from 'classnames';

export default function StopJobConfirm(props) {
  const {hideDialog, setHideDialog, currentJob, stopJob} = props;
  const {selectedJobs} = useContext(Context);

  function onStopJob() {
    setHideDialog(true);
    if (selectedJobs || currentJob) {
      const willStopedJobs = selectedJobs.filter((job) => {
        return getStatusText(job) === 'Waiting' || getStatusText(job) === 'Running';
      });
      stopJob(willStopedJobs.length === 0 ? currentJob : willStopedJobs);
    } else {
      stopJob();
    }
  }

  function closeDialog() {
    setHideDialog(true);
  }

  return (
    <Dialog
      hidden={hideDialog}
      onDismiss={closeDialog}
      minWidth={400}
      maxWidth={500}
      dialogContentProps={{
        showCloseButton: false,
        title: <span className={c(t.flex)}><Icon iconName='Info'/>&nbsp;Stop job(s)</span>,
      }}
      modalProps={{
        styles: {
          main: {maxWidth: 500},
        },
      }}
    >
      <div className={c(t.fw4)}>
        <span>Are you sure you want to stop the selected job(s)?</span>
        <p>Stopping job(s) will release all the allocated resources for the job(s) and can&lsquo;t be undone.</p>
      </div>
      <DialogFooter>
        <PrimaryButton onClick={onStopJob} text="Confirm" />
        <DefaultButton onClick={closeDialog} text="Cancel" />
      </DialogFooter>
    </Dialog>
  );
}

StopJobConfirm.propTypes = {
  hideDialog: PropTypes.bool.isRequired,
  setHideDialog: PropTypes.func.isRequired,
  currentJob: PropTypes.array,
  stopJob: PropTypes.func.isRequired,
};
