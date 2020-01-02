import React, { useContext, useState, useEffect, useCallback } from 'react';
import classNames from 'classnames';
import {
  FontClassNames,
  MessageBar,
  MessageBarType,
  Stack,
} from 'office-ui-fabric-react';
import { isEmpty, isNil, get } from 'lodash';

import t from '../../../components/tachyons.scss';
import Context from '../Context';
import Summary from './summary';
import {
  fetchJobConfig,
  fetchJobInfo,
  fetchRawJobConfig,
  fetchSshInfo,
  NotFoundError,
} from '../utils/conn';
import { SpinnerLoading } from '../../../components/loading';
import TaskRoles from './task-roles';

const JobDetail = () => {
  const { currentJob } = useContext(Context);

  const [currentJobConfig, setCurrentJobConfig] = useState(null);
  const [jobInfo, setJobInfo] = useState(null);
  const [rawJobConfig, setRawJobConfig] = useState(null);
  const [sshInfo, setSshInfo] = useState(null);

  const [loading, setLoading] = useState(true);
  const [reloading, setReloading] = useState(false);

  useEffect(() => {
    reload(true);
  }, []);

  async function reload(alertFlag) {
    setReloading(true);
    const nextState = { loading: false, reloading: false, error: null };
    const loadJobInfo = async () => {
      const { name, namespace, username } = currentJob;
      try {
        nextState.jobInfo = await fetchJobInfo(namespace || username, name);
      } catch (err) {
        nextState.error = `fetch job status failed: ${err.message}`;
      }
    };
    const loadJobConfig = async () => {
      const { name, namespace, username } = currentJob;
      try {
        nextState.jobConfig = await fetchJobConfig(namespace || username, name);
      } catch (err) {
        if (err instanceof NotFoundError) {
          nextState.jobConfig = null;
        } else {
          nextState.error = `fetch job config failed: ${err.message}`;
        }
      }
    };
    const loadRawJobConfig = async () => {
      const { name, namespace, username } = currentJob;
      try {
        nextState.rawJobConfig = await fetchRawJobConfig(
          namespace || username,
          name,
        );
      } catch (err) {
        if (err instanceof NotFoundError) {
          nextState.rawJobConfig = null;
        } else {
          nextState.error = `fetch job config failed: ${err.message}`;
        }
      }
    };
    const loadSshInfo = async () => {
      const { name, namespace, username } = currentJob;
      try {
        nextState.sshInfo = await fetchSshInfo(namespace || username, name);
      } catch (err) {
        if (err instanceof NotFoundError) {
          nextState.sshInfo = null;
        } else {
          nextState.error = `fetch ssh info failed: ${err.message}`;
        }
      }
    };
    await Promise.all([
      loadJobInfo(),
      loadJobConfig(),
      loadRawJobConfig(),
      loadSshInfo(),
    ]);
    if (alertFlag === true && !isNil(nextState.error)) {
      alert(nextState.error);
    }

    setJobInfo(nextState.jobInfo);
    setCurrentJobConfig(nextState.jobConfig);
    setRawJobConfig(nextState.rawJobConfig);
    setSshInfo(nextState.sshInfo);

    setReloading(nextState.reloading);
    setLoading(nextState.loading);
  }

  if (loading) {
    return <SpinnerLoading />;
  } else {
    return (
      <div className={classNames(t.w100, t.pa4, FontClassNames.medium)}>
        <Summary
          className={t.mt3}
          jobInfo={jobInfo}
          reloading={reloading}
          onReload={reload}
          currentJob={currentJob}
          rawJobConfig={rawJobConfig}
        />
        <TaskRoles jobConfig={currentJobConfig} jobInfo={jobInfo} />
      </div>
    );
  }
};

export default JobDetail;
