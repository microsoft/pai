import React, { useState, useContext, useMemo, useCallback } from 'react';
import {
  ShimmeredDetailsList,
  FontClassNames,
  Link,
  Icon,
  ColorClassNames,
  FontSizes,
  FontWeights,
  DefaultButton,
  mergeStyles,
  Stack,
  SelectionMode,
  Selection,
} from 'office-ui-fabric-react';
import { isNil } from 'lodash';
import c from 'classNames';
import { DateTime } from 'luxon';
import PropTypes from 'prop-types';

import t from '../../../components/tachyons.scss';
import PublishDialog from './publish-dialog';
import Context from '../Context';
import { getModified, getStatusText } from '../utils/utils';
import {
  getDurationString,
  getJobDuration,
} from '../../../components/util/job';
import StatusBadge from '../../../components/status-badge';
import JobDetailDialog from './job-detail-dialog';

const zeroPaddingClass = mergeStyles({
  paddingTop: '0px !important',
  paddingLeft: '0px !important',
  paddingRight: '0px !important',
  paddingBottom: '0px !important',
});

const Table = props => {
  const { setHideSuccessJobsDialog } = props;
  const { filteredJobs, pagination, currentJob, setCurrentJob } = useContext(
    Context,
  );
  const [hideJobDetailDialog, setHideJobDetailDialog] = useState(true);

  const selection = useMemo(() => {
    return new Selection({
      onSelectionChanged() {
        setCurrentJob(selection.getSelection()[0]);
        console.log(selection.getSelection()[0]);
        console.log(currentJob);
      },
    });
  }, []);

  const openJobDetailDialog = useCallback(() => {
    // close job-list dialog
    setHideSuccessJobsDialog(true);
    // open job-detail dialog
    setHideJobDetailDialog(false);
  }, []);

  const nameColumn = {
    key: 'name',
    minWidth: 200,
    name: 'Name',
    fieldName: 'name',
    className: FontClassNames.mediumPlus,
    headerClassName: FontClassNames.medium,
    isResizable: true,
    onRender(job) {
      const { legacy, name, namespace, username } = job;
      /*
      const href = legacy
        ? `/job-detail.html?jobName=${name}`
        : `/job-detail.html?username=${namespace || username}&jobName=${name}`;
      return <Link href={href}>{name}</Link>;
      */
      return <Link onClick={openJobDetailDialog}>{name}</Link>;
    },
  };

  const modifiedColumn = {
    key: 'modified',
    minWidth: 150,
    name: 'Date Modified',
    className: FontClassNames.mediumPlus,
    headerClassName: FontClassNames.medium,
    isResizable: true,
    onRender(job) {
      return DateTime.fromJSDate(getModified(job)).toLocaleString(
        DateTime.DATETIME_SHORT_WITH_SECONDS,
      );
    },
  };

  const durationColumn = {
    key: 'duration',
    minWidth: 60,
    name: 'Duration',
    className: FontClassNames.mediumPlus,
    headerClassName: FontClassNames.medium,
    isResizable: true,
    onRender(job) {
      return getDurationString(getJobDuration(job));
    },
  };

  const virtualClusterColumn = {
    key: 'virtualCluster',
    minWidth: 100,
    name: 'Virtual Cluster',
    fieldName: 'virtualCluster',
    className: FontClassNames.mediumPlus,
    headerClassName: FontClassNames.medium,
    isResizable: true,
  };

  const retriesColumn = {
    key: 'retries',
    minWidth: 60,
    name: 'Retries',
    fieldName: 'retries',
    className: FontClassNames.mediumPlus,
    headerClassName: FontClassNames.medium,
    isResizable: true,
  };

  const taskCountColumn = {
    key: 'taskCount',
    minWidth: 60,
    name: 'Tasks',
    fieldName: 'totalTaskNumber',
    className: FontClassNames.mediumPlus,
    headerClassName: FontClassNames.medium,
    isResizable: true,
  };

  const gpuCountColumn = {
    key: 'gpuCount',
    minWidth: 60,
    name: 'GPUs',
    fieldName: 'totalGpuNumber',
    className: FontClassNames.mediumPlus,
    headerClassName: FontClassNames.medium,
    isResizable: true,
  };

  const statusColumn = {
    key: 'status',
    minWidth: 100,
    name: 'Status',
    headerClassName: FontClassNames.medium,
    isResizable: true,
    onRender(job) {
      return (
        <div
          style={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'start',
          }}
        >
          <StatusBadge status={getStatusText(job)} />
        </div>
      );
    },
  };
  /*
  const actionsColumn = {
    key: 'publish',
    minWidth: 100,
    name: 'Publish',
    headerClassName: FontClassNames.medium,
    className: zeroPaddingClass,
    onRender(job) {
      async function showDialog(event) {
        event.stopPropagation();
        // check if this job can be published
        const { legacy, name, namespace, username } = job;
        if (legacy) {
          alert('This job can not be published because of legacy');
          return;
        }
        // fetch jobConfig
        const jobConfig = await fetchJobConfig(namespace || username, name);
        // check extras
        if (jobConfig.extras) {
          alert('This job can not be published because of extras');
          return;
        }
        setCurrentJobConfig(jobConfig);
        setCurrentJob(job);
        setHideDialog(false);
      }

      return (
        <div
          style={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          data-selection-disabled
        >
          <DefaultButton
            iconProps={{ iconName: 'PublisherLogo16' }}
            styles={{
              root: { backgroundColor: '#e5e5e5' },
              rootFocused: { backgroundColor: '#e5e5e5' },
              rootDisabled: { backgroundColor: '#eeeeee' },
              rootCheckedDisabled: { backgroundColor: '#eeeeee' },
              icon: { fontSize: 12 },
            }}
            onClick={showDialog}
          >
            publish
          </DefaultButton>
        </div>
      );
    },
  };
*/
  const columns = [
    nameColumn,
    modifiedColumn,
    durationColumn,
    virtualClusterColumn,
    retriesColumn,
    taskCountColumn,
    gpuCountColumn,
    statusColumn,
  ];

  if (!isNil(filteredJobs) && filteredJobs.length === 0) {
    return (
      <div className={c(t.h100, t.flex, t.itemsCenter, t.justifyCenter)}>
        <div className={c(t.tc)}>
          <div>
            <Icon
              className={c(ColorClassNames.themePrimary)}
              style={{ fontSize: FontSizes.xxLarge }}
              iconName='Error'
            />
          </div>
          <div
            className={c(t.mt5, FontClassNames.xLarge)}
            style={{ fontWeight: FontWeights.semibold }}
          >
            No results matched your search.
          </div>
        </div>
      </div>
    );
  } else {
    const items = pagination.apply(filteredJobs || []);
    return (
      <div>
        <ShimmeredDetailsList
          items={items}
          setKey='key'
          columns={columns}
          enableShimmer={items.length === 0}
          shimmerLines={pagination.itemsPerPage}
          selectionMode={SelectionMode.single}
          selection={selection}
        />
        <JobDetailDialog
          job={currentJob}
          hideJobDetailDialog={hideJobDetailDialog}
          setHideJobDetailDialog={setHideJobDetailDialog}
        />
      </div>
    );
  }
};

Table.propTypes = {
  setHideSuccessJobsDialog: PropTypes.func,
};

export default Table;
