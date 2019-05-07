import React, {useContext, useMemo} from 'react';

import {DefaultButton} from 'office-ui-fabric-react/lib/Button';
import {Link} from 'office-ui-fabric-react/lib/Link';
import {ColumnActionsMode, Selection} from 'office-ui-fabric-react/lib/DetailsList';
import {MessageBar, MessageBarType} from 'office-ui-fabric-react/lib/MessageBar';
import {ShimmeredDetailsList} from 'office-ui-fabric-react/lib/ShimmeredDetailsList';
import {FontClassNames} from 'office-ui-fabric-react/lib/Styling';
import StatusBadge from '../job-detail/components/status-badge';
import c from 'classnames';
import t from '../tachyons.css';

import {DateTime, Duration} from 'luxon';

import {getModified, getDuration, getStatusText} from './utils';
import Context from './Context';
import Ordering from './Ordering';

const zeroPaddingRowFieldStyle = {
  marginTop: -11,
  marginBottom: -11,
  marginLeft: -12,
  marginRight: -8,
};

export default function Table() {
  const {allJobs, stopJob, filteredJobs, setSelectedJobs, filter, ordering, setOrdering, pagination} = useContext(Context);

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
      /** @type {React.CSSProperties} */
      const statusText = getStatusText(job);
      return (
        <div style={Object.assign(zeroPaddingRowFieldStyle) } className={c(t.w1, t.dib, t.vMid)}>
          <StatusBadge status={statusText} />
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
    columnActionsMode: ColumnActionsMode.disabled,
    onRender(job) {
      /**
       * @param {React.MouseEvent} event
       */
      function onClick(event) {
        event.stopPropagation();
        stopJob(job);
      }
      /** @type {React.CSSProperties} */
      const statusText = getStatusText(job);
      const disabled = statusText !== 'Waiting' && statusText !== 'Running';
      return (
        <div style={Object.assign(zeroPaddingRowFieldStyle)} className={c(t.w1, t.dib, t.vMid)} data-selection-disabled>
          <DefaultButton
            iconProps={{iconName: 'StatusCircleBlock'}}
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

  return (
    <ShimmeredDetailsList
      items={pagination.apply(ordering.apply(filteredJobs || []))}
      setKey="key"
      columns={columns}
      enableShimmer={allJobs === null}
      shimmerLines={pagination.itemsPerPage}
      selection={selection}
    />
  );
}
