import React, { useCallback, useState } from 'react';
import {
  Dialog,
  DialogType,
  DialogFooter,
  PrimaryButton,
  DefaultButton,
} from 'office-ui-fabric-react';
import { getTheme } from '@uifabric/styling';
import { isNil } from 'lodash';
import PropTypes from 'prop-types';

import SuccessJobList from './success-job-list';
import { isPublishable } from '../../../components/util/job';
import Context from '../Context';
import Filter from '../Filter';
import Pagination from '../Pagination';
import { fetchJobConfig } from '../utils/conn';
import PublishDialog from './publish-dialog';

const SuccessJobsDialog = props => {
  const { spacing } = getTheme();

  const { hideDialog, setHideDialog } = props;

  const [successJobs, setSuccessJobs] = useState(null);
  const [filteredJobs, setFilteredJobs] = useState(null);
  const [filter, setFilter] = useState(new Filter());
  const [pagination, setPagination] = useState(new Pagination());
  const [currentJob, setCurrentJob] = useState(null);
  const [currentJobConfig, setCurrentJobConfig] = useState(null);

  const [hidePublishDialog, setHidePublishDialog] = useState(true);

  const closeDialog = useCallback(() => {
    setHideDialog(true);
  }, []);

  const publishJob = useCallback(() => {
    setHideDialog(true);
    setHidePublishDialog(false);
  }, []);

  const onPublish = useCallback(async () => {
    if (isNil(currentJob)) {
      return;
    }
    // check if this job can be published
    const { legacy, name, namespace, username } = currentJob;
    if (legacy) {
      alert('This job can not be published because of legacy');
      return;
    }
    // fetch jobConfig
    const jobConfig = await fetchJobConfig(namespace || username, name);
    setCurrentJobConfig(jobConfig);

    if (!isPublishable(currentJob, jobConfig)) {
      alert('This job cannot be published because of extras');
    } else {
      publishJob(currentJob);
    }
  }, []);

  const context = {
    successJobs,
    setSuccessJobs,
    filteredJobs,
    setFilteredJobs,
    filter,
    setFilter,
    pagination,
    setPagination,
    currentJob,
    setCurrentJob,
    currentJobConfig,
    setCurrentJobConfig,
  };

  return (
    <Context.Provider value={context}>
      <Dialog
        hidden={hideDialog}
        onDismiss={closeDialog}
        minWidth={1200}
        dialogContentProps={{
          type: DialogType.normal,
          showCloseButton: false,
        }}
        modalProps={{
          isBlocking: true,
        }}
      >
        <SuccessJobList setHideSuccessJobsDialog={setHideDialog} />
        <DialogFooter>
          <PrimaryButton onClick={onPublish} text='Publish' />
          <DefaultButton onClick={closeDialog} text='Cancel' />
        </DialogFooter>
      </Dialog>
      <PublishDialog
        hideDialog={hidePublishDialog}
        setHideDialog={setHidePublishDialog}
      />
    </Context.Provider>
  );
};

SuccessJobsDialog.propTypes = {
  hideDialog: PropTypes.bool,
  setHideDialog: PropTypes.func,
};

export default SuccessJobsDialog;
