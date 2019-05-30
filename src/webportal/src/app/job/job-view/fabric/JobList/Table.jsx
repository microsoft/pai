import c from 'classnames';
import React, {useContext, useMemo, useLayoutEffect} from 'react';
import {ColumnActionsMode, DefaultButton, FontClassNames, Link, mergeStyles, Selection, ShimmeredDetailsList, Icon, ColorClassNames, FontSizes, FontWeights} from 'office-ui-fabric-react';
import {isNil} from 'lodash';
import {DateTime, Duration} from 'luxon';

import {getModified, getDuration, getStatusText} from './utils';
import Context from './Context';
import Filter from './Filter';
import Ordering from './Ordering';
import StatusBadge from '../../../../components/status-badge';

import t from '../../../../components/tachyons.scss';

const zeroPaddingClass = mergeStyles({
  paddingTop: '0px !important',
  paddingLeft: '0px !important',
  paddingRight: '0px !important',
  paddingBottom: '0px !important',
});

export default function Table() {
  const {stopJob, filteredJobs, setSelectedJobs, filter, ordering, setOrdering, pagination, setFilter} = useContext(Context);

  // workaround for fabric's bug
  // https://github.com/OfficeDev/office-ui-fabric-react/issues/5280#issuecomment-489619108
  useLayoutEffect(() => {
    window.dispatchEvent(new Event('resize'));
  });

  /**
   * @type {import('office-ui-fabric-react').Selection}
   */
  const selection = useMemo(() => {
    return new Selection({
      onSelectionChanged() {
        setSelectedJobs(selection.getSelection());
      },
    });
  }, []);

  /**
   * @param {React.MouseEvent<HTMLElement>} event
   * @param {import('office-ui-fabric-react').IColumn} column
   */
  function onColumnClick(event, column) {
    const {field, descending} = ordering;
    if (field === column.key) {
      if (descending) {
        setOrdering(new Ordering());
      } else {
        setOrdering(new Ordering(field, true));
      }
    } else {
      setOrdering(new Ordering(column.key));
    }
  }

  /**
   * @param {import('office-ui-fabric-react').IColumn} column
   */
  function applySortProps(column) {
    column.isSorted = ordering.field === column.key;
    column.isSortedDescending = ordering.descending;
    column.onColumnClick = onColumnClick;
    return column;
  }

  const nameColumn = applySortProps({
    key: 'name',
    minWidth: 200,
    name: 'Name',
    fieldName: 'name',
    className: FontClassNames.mediumPlus,
    headerClassName: FontClassNames.medium,
    isResizable: true,
    isFiltered: filter.keyword !== '',
    onRender(job) {
      const {legacy, name, namespace, username} = job;
      const href = legacy
        ? `/job-detail.html?jobName=${name}`
        : `/job-detail.html?username=${namespace || username}&jobName=${name}`;
      return <Link href={href}>{name}</Link>;
    },
  });
  const modifiedColumn = applySortProps({
    key: 'modified',
    minWidth: 150,
    name: 'Date Modified',
    className: FontClassNames.mediumPlus,
    headerClassName: FontClassNames.medium,
    isResizable: true,
    isSorted: ordering.field === 'modified',
    isSortedDescending: !ordering.descending,
    onRender(job) {
      return DateTime.fromJSDate(getModified(job)).toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS);
    },
  });
  const userColumn = applySortProps({
    key: 'user',
    minWidth: 100,
    name: 'User',
    fieldName: 'username',
    className: FontClassNames.mediumPlus,
    headerClassName: FontClassNames.medium,
    isResizable: true,
    isFiltered: filter.users.size > 0,
  });
  const durationColumn = applySortProps({
    key: 'duration',
    minWidth: 60,
    name: 'Duration',
    className: FontClassNames.mediumPlus,
    headerClassName: FontClassNames.medium,
    isResizable: true,
    onRender(job) {
      return Duration.fromMillis(getDuration(job)).toFormat(`h:mm:ss`);
    },
  });
  const virtualClusterColumn = applySortProps({
    key: 'virtualCluster',
    minWidth: 100,
    name: 'Virtual Cluster',
    fieldName: 'virtualCluster',
    className: FontClassNames.mediumPlus,
    headerClassName: FontClassNames.medium,
    isResizable: true,
    isFiltered: filter.virtualClusters.size > 0,
  });
  const retriesColumn = applySortProps({
    key: 'retries',
    minWidth: 60,
    name: 'Retries',
    fieldName: 'retries',
    className: FontClassNames.mediumPlus,
    headerClassName: FontClassNames.medium,
    isResizable: true,
  });
  const taskCountColumn = applySortProps({
    key: 'taskCount',
    minWidth: 60,
    name: 'Tasks',
    fieldName: 'totalTaskNumber',
    className: FontClassNames.mediumPlus,
    headerClassName: FontClassNames.medium,
    isResizable: true,
  });
  const gpuCountColumn = applySortProps({
    key: 'gpuCount',
    minWidth: 60,
    name: 'GPUs',
    fieldName: 'totalGpuNumber',
    className: FontClassNames.mediumPlus,
    headerClassName: FontClassNames.medium,
    isResizable: true,
  });
  const statusColumn = applySortProps({
    key: 'status',
    minWidth: 100,
    name: 'Status',
    headerClassName: FontClassNames.medium,
    isResizable: true,
    isFiltered: filter.statuses.size > 0,
    onRender(job) {
      return (
        <div style={{height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'start'}}>
          <StatusBadge status={getStatusText(job)} />
        </div>
      );
    },
  });

  /**
   * @type {import('office-ui-fabric-react').IColumn}
   */
  const actionsColumn = {
    key: 'actions',
    minWidth: 100,
    name: 'Actions',
    headerClassName: FontClassNames.medium,
    className: zeroPaddingClass,
    columnActionsMode: ColumnActionsMode.disabled,
    onRender(job) {
      /**
       * @param {React.MouseEvent} event
       */
      function onClick(event) {
        event.stopPropagation();
        stopJob(job);
      }

      const statusText = getStatusText(job);
      const disabled = statusText !== 'Waiting' && statusText !== 'Running';
      return (
        <div style={{height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center'}} data-selection-disabled>
          <DefaultButton
            iconProps={{iconName: 'StopSolid'}}
            styles={{
              root: {backgroundColor: '#e5e5e5'},
              rootFocused: {backgroundColor: '#e5e5e5'},
              icon: {fontSize: 12},
            }}
            disabled={disabled}
            onClick={onClick}
          >
            Stop
          </DefaultButton>
        </div>
      );
    },
  };

  const columns = [
    nameColumn,
    modifiedColumn,
    userColumn,
    durationColumn,
    virtualClusterColumn,
    retriesColumn,
    taskCountColumn,
    gpuCountColumn,
    statusColumn,
    actionsColumn,
  ];

  if (!isNil(filteredJobs) && filteredJobs.length === 0) {
    return (
      <div className={c(t.h100, t.flex, t.itemsCenter, t.justifyCenter)}>
        <div className={c(t.tc)}>
          <div>
            <Icon className={c(ColorClassNames.themePrimary)} style={{fontSize: FontSizes.xxLarge}} iconName='Error' />
          </div>
          <div className={c(t.mt5, FontClassNames.xLarge)} style={{fontWeight: FontWeights.semibold}}>
            No results matched your search.
          </div>
          <div className={c(t.mt4, FontClassNames.mediumPlus)}>
            You could search <Link onClick={() => setFilter(new Filter())}>all the jobs</Link> or try advanced search with Filters.
          </div>
        </div>
      </div>
    );
  } else {
    const items = pagination.apply(ordering.apply(filteredJobs || []));
    return (
      <ShimmeredDetailsList
        items={items}
        setKey="key"
        columns={columns}
        enableShimmer={isNil(filteredJobs)}
        shimmerLines={pagination.itemsPerPage}
        selection={selection}
      />
    );
  }
}
