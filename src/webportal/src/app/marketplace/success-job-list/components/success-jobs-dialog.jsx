import React, { useCallback, useState, useEffect } from 'react';
import {
  Dialog,
  DialogType,
  DialogFooter,
  PrimaryButton,
  DefaultButton,
  SemanticColorSlots,
  Stack,
} from 'office-ui-fabric-react';
import { getTheme } from '@uifabric/styling';
import { isNil } from 'lodash';
import PropTypes from 'prop-types';
import uuid4 from 'uuid/v4';
import yaml from 'js-yaml';

import SuccessJobList from './success-job-list';
import { isPublishable } from '../../../components/util/job';
import Context from '../Context';
import Filter from '../Filter';
import Pagination from '../Pagination';
import {
  createMarketItem,
  fetchJobConfig,
  fetchJobInfo,
  fetchRawJobConfig,
  fetchSshInfo,
  NotFoundError,
} from '../utils/conn';
import PublishDialog from './publish-dialog';
import JobDetail from './job-detail';
import PublishView from './publish-view';
import { MarketItem } from '../../models/market-item';

const SuccessJobsDialog = props => {
  const { spacing } = getTheme();

  const { hideDialog, setHideDialog } = props;

  const [successJobs, setSuccessJobs] = useState(null);
  const [filteredJobs, setFilteredJobs] = useState(null);
  const [filter, setFilter] = useState(new Filter());
  const [pagination, setPagination] = useState(new Pagination());
  const [currentJob, setCurrentJob] = useState(null);
  const [currentJobConfig, setCurrentJobConfig] = useState(null);

  const [openJobDetail, setOpenJobDetail] = useState(false);
  const [openPublish, setOpenPublish] = useState(false);
  //const [hidePublishDialog, setHidePublishDialog] = useState(true);

  // published market iten info
  const [name, setName] = useState('');
  const [category, setCategory] = useState('custom');
  const [tags, setTags] = useState([]);
  const [introduction, setIntroduction] = useState('');
  const [description, setDescription] = useState('');

  /*
  useEffect(() => {
    console.log('useEffect', openJobDetail);
    console.log('useEffect', currentJob);
    if (isNil(currentJob)) {
      return;
    }
    reload(false);
  }, [openJobDetail]);
  */

  const onPublish = useCallback(() => {
    if (openJobDetail) {
      setOpenJobDetail(false);
    }
    openPublishViewWrapper();
  }, [currentJob, openJobDetail]);

  async function openPublishViewWrapper() {
    const openPublishView = async () => {
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
        setOpenPublish(true);
      }
    };

    await openPublishView();
  }

  const closePublishView = useCallback(() => {
    if (openJobDetail === true) {
      setOpenJobDetail(false);
    }
    if (openPublish === true) {
      setOpenPublish(false);
    }
    setName('');
    setCategory('custom');
    setTags([]);
    setIntroduction('');
    setDescription('');
    //setHideDialog(true);
  }, [openPublish]);

  const closeDialog = useCallback(() => {
    if (openJobDetail === true) {
      setOpenJobDetail(false);
    }
    if (openPublish === true) {
      setOpenPublish(false);
    }
    setHideDialog(true);
  }, []);

  const onBack = useCallback(() => {
    setOpenJobDetail(false);
  }, []);

  const checkRequired = useCallback(() => {
    if (name === '') {
      alert('Title required');
      return false;
    }
    if (introduction === '') {
      alert('introduction required');
      return false;
    }
    if (description === '') {
      alert('description required');
      return false;
    }
    if (isNil(currentJobConfig)) {
      alert('yaml file required');
      return false;
    }
    return true;
  }, [name, category, tags, introduction, description]);

  const onConfirm = useCallback(async () => {
    // check required
    if (!checkRequired()) {
      return;
    }
    setHideDialog(true);
    setOpenPublish(false);

    // post a marketitem
    const marketItem = new MarketItem(
      uuid4(),
      name,
      cookies.get('user'),
      new Date(),
      new Date(),
      category,
      tags,
      introduction,
      description,
      yaml.safeDump(currentJobConfig),
      0,
      0,
    );
    const itemId = await createMarketItem(marketItem);
    // refresh market-detail.html
    window.location.href = `/market-detail.html?itemId=${itemId}`;
  }, [currentJob, name, category, tags, introduction, description]);

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

    // open job detail
    openJobDetail,
    setOpenJobDetail,

    // published market item info
    name,
    setName,
    category,
    setCategory,
    tags,
    setTags,
    introduction,
    setIntroduction,
    description,
    setDescription,
  };

  return (
    <Context.Provider value={context}>
      <Dialog
        hidden={hideDialog}
        onDismiss={closeDialog}
        minWidth={800}
        maxWidth={2000}
        dialogContentProps={{
          type: DialogType.normal,
          showCloseButton: false,
        }}
        modalProps={{
          isBlocking: true,
        }}
      >
        <Stack styles={{ root: { height: '100%', minHeight: 640 } }}>
          {!openJobDetail && !openPublish && <SuccessJobList />}
          {openJobDetail && <JobDetail />}
          {openPublish && <PublishView />}
        </Stack>
        {!openJobDetail && !openPublish && (
          <DialogFooter>
            <PrimaryButton onClick={onPublish} text='Publish' />
            <DefaultButton onClick={closeDialog} text='Cancel' />
          </DialogFooter>
        )}
        {openJobDetail && (
          <DialogFooter>
            <DefaultButton onClick={onBack} text='Back' />
            <PrimaryButton onClick={onPublish} text='Publish' />
          </DialogFooter>
        )}
        {openPublish && (
          <DialogFooter>
            <PrimaryButton onClick={onConfirm} text='Confirm' />
            <DefaultButton onClick={closePublishView} text='Cancel' />
          </DialogFooter>
        )}
      </Dialog>
      {/*
      <PublishDialog
        hideDialog={hidePublishDialog}
        setHideDialog={setHidePublishDialog}
      />
      */}
    </Context.Provider>
  );
};

SuccessJobsDialog.propTypes = {
  hideDialog: PropTypes.bool,
  setHideDialog: PropTypes.func,
};

export default SuccessJobsDialog;
