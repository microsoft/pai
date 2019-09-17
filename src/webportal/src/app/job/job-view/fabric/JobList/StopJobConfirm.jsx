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
import { FontClassNames, FontSizes } from '@uifabric/styling';
import c from 'classnames';
import PropTypes from 'prop-types';
import React, { useContext } from 'react';
import {
  DefaultButton,
  PrimaryButton,
  Dialog,
  DialogFooter,
  Icon,
} from 'office-ui-fabric-react';

import t from '../../../../components/tachyons.scss';

import Context from './Context';
import { isStoppable } from '../../../../components/util/job';

export default function StopJobConfirm(props) {
  const { hideDialog, setHideDialog, currentJob, stopJob } = props;
  const { selectedJobs } = useContext(Context);

  function onStopJob() {
    setHideDialog(true);
    if (selectedJobs || currentJob) {
      const willStopedJobs = selectedJobs.filter(job => isStoppable(job));
      willStopedJobs.length === 0
        ? stopJob(currentJob)
        : stopJob(...willStopedJobs);
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
      minWidth={500}
      maxWidth={600}
      dialogContentProps={{
        showCloseButton: false,
        styles: {
          title: { paddingBottom: '12px' },
        },
        title: (
          <span
            className={c(t.flex, t.fw6)}
            style={{ fontSize: FontSizes.icon }}
          >
            <Icon
              iconName='Info'
              styles={{
                root: { marginRight: '6px' },
              }}
            />
            Stop job(s)
          </span>
        ),
      }}
    >
      <div
        className={c(t.fw4, FontClassNames.small)}
        style={{ marginLeft: '22px' }}
      >
        <span>Are you sure you want to stop the selected job(s)?</span>
        <p>
          Stopping job(s) will release all the allocated resources for the
          job(s) and can&lsquo;t be undone.
        </p>
      </div>
      <DialogFooter>
        <PrimaryButton onClick={onStopJob} text='Confirm' />
        <DefaultButton onClick={closeDialog} text='Cancel' />
      </DialogFooter>
    </Dialog>
  );
}

StopJobConfirm.propTypes = {
  hideDialog: PropTypes.bool.isRequired,
  setHideDialog: PropTypes.func.isRequired,
  currentJob: PropTypes.object,
  stopJob: PropTypes.func.isRequired,
};
