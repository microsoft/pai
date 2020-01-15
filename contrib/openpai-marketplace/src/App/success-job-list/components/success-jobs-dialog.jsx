import React, { useCallback, useState, useContext } from 'react';
import {
  Dialog,
  DialogType,
  DialogFooter,
  PrimaryButton,
  DefaultButton,
  Stack,
  FontClassNames,
  FontWeights,
} from 'office-ui-fabric-react';
import { isNil } from 'lodash';
import PropTypes from 'prop-types';
import uuid4 from 'uuid/v4';
import yaml from 'js-yaml';
import c from 'classnames';

import t from '../../components/tachyons.scss';

import SuccessJobList from './success-job-list';
import { isPublishable } from '../utils/job';
import Context from '../Context';
import Filter from '../Filter';
import Pagination from '../Pagination';
import JobDetail from './job-detail';
import PublishView from './publish-view';
import { MarketItem } from '../../models/market-item';
import ContextMarketList from '../../market-list/Context';

const SuccessJobsDialog = props => {
  const { hideDialog, setHideDialog } = props;
  const { api } = useContext(ContextMarketList);

  const [successJobs, setSuccessJobs] = useState(null);
  const [filteredJobs, setFilteredJobs] = useState(null);
  const [filter, setFilter] = useState(new Filter());
  const [pagination, setPagination] = useState(new Pagination());
  const [currentJob, setCurrentJob] = useState(null);
  const [currentJobConfig, setCurrentJobConfig] = useState(null);

  const [openJobDetail, setOpenJobDetail] = useState(false);
  const [openPublish, setOpenPublish] = useState(false);

  // published market iten info
  const [name, setName] = useState('');
  const [category, setCategory] = useState('custom');
  const [tags, setTags] = useState([]);
  const [introduction, setIntroduction] = useState('');
  const [description, setDescription] = useState('');

  // success dialog title
  const [successDialogTitle, setSuccessDialogTitle] = useState(
    'Publish to Marketplace',
  );

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
        setSuccessDialogTitle('Create a market item');
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

    setSuccessDialogTitle('Publish to Marketplace');
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
    setSuccessDialogTitle('Publish to Marketplace');
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

  async function createMarketItem(marketItem) {
    const url = `${api}/api/v2/marketplace/items`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: marketItem.name,
        author: marketItem.author,
        category: marketItem.category,
        introduction: marketItem.introduction,
        description: marketItem.description,
        jobConfig: marketItem.jobConfig,
        submits: marketItem.submits,
        starNumber: marketItem.stars,
        tags: marketItem.tags,
      }),
    });
    const json = await res.json();
    if (res.ok) {
      return json;
    } else {
      throw new Error(json);
    }
  }

  async function fetchJobConfig(userName, jobName) {
    const url = userName
      ? `${api}/api/v2/jobs/${userName}~${jobName}/config`
      : `${api}/api/v1/jobs/${jobName}/config`;
    const res = await fetch(url);
    const text = await res.text();
    const json = yaml.safeLoad(text);
    if (res.ok) {
      return json;
    } else {
      if (json.code === 'NoJobConfigError') {
        throw new NotFoundError(json.message);
      } else {
        throw new Error(json.message);
      }
    }
  }

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

    // success dialog title
    setSuccessDialogTitle,
  };

  return (
    <Context.Provider value={context}>
      <Dialog
        hidden={hideDialog}
        onDismiss={closeDialog}
        minWidth={800}
        maxWidth={2000}
        dialogContentProps={{
          styles: {
            title: { padding: '20px 36px 12px 20px' },
            inner: { padding: '0px 40px 20px 20px' },
            topButton: { padding: '20px 20px 0px 0px' },
          },
          title: (
            <span
              className={c(t.mb2, t.fw6, FontClassNames.semibold)}
              style={{
                fontSize: 16,
                fontWeight: FontWeights.semibold,
              }}
            >
              {successDialogTitle}
            </span>
          ),
          type: DialogType.normal,
          showCloseButton: false,
        }}
        modalProps={{
          isBlocking: true,
        }}
      >
        <Stack styles={{ root: { height: '100%', minHeight: 500 } }}>
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
