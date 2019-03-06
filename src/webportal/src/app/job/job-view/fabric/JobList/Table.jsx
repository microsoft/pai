import React, {useContext} from 'react';

import {ActionButton} from 'office-ui-fabric-react/lib/Button';
import {Link} from 'office-ui-fabric-react/lib/Link';
import {ColumnActionsMode, CheckboxVisibility} from 'office-ui-fabric-react/lib/DetailsList';
import {MessageBar, MessageBarType} from 'office-ui-fabric-react/lib/MessageBar';
import {ShimmeredDetailsList} from 'office-ui-fabric-react/lib/ShimmeredDetailsList';

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
  const {allJobs, stopJob, filteredJobs, filter, ordering, setOrdering, pagination} = useContext(Context);

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
    minWidth: 0,
    fieldName: 'name',
    isRowHeader: true,
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
    minWidth: 200,
    name: 'Date Modified',
    isSorted: ordering.field === 'modified',
    isSortedDescending: !ordering.descending,
    onRender(job) {
      return DateTime.fromJSDate(getModified(job)).toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS);
    },
  });
  const userColumn = applySortProps({
    key: 'user',
    minWidth: 0,
    name: 'User',
    fieldName: 'username',
  });
  const durationColumn = applySortProps({
    key: 'duration',
    minWidth: 0,
    name: 'Duration',
    onRender(job) {
      return Duration.fromMillis(getDuration(job)).toFormat(`h:mm:ss`);
    },
  });
  const virtualClusterColumn = applySortProps({
    key: 'virtualCluster',
    minWidth: 0,
    name: 'Virtual Cluster',
    fieldName: 'virtualCluster',
  });
  const statusColumn = applySortProps({
    key: 'status',
    minWidth: 0,
    name: 'Status',
    onRender(job) {
      /** @type {React.CSSProperties} */
      const wrapperStyle = {display: 'inline-block', verticalAlign: 'middle'};
      /** @type {import('@uifabric/styling').IStyle} */
      const statusText = getStatusText(job);
      /** @type {MessageBarType} */
      const messageBarType = {
        Waiting: MessageBarType.warning,
        Running: MessageBarType.info,
        Stopping: MessageBarType.severeWarning,
        Succeeded: MessageBarType.success,
        Failed: MessageBarType.error,
        Stopped: MessageBarType.blocked,
      }[statusText];
      /** @type {import('@uifabric/styling').IStyle} */
      const iconContainerStyle = {marginTop: 8, marginBottom: 8, marginLeft: 8};
      /** @type {import('@uifabric/styling').IStyle} */
      const textStyle = {marginTop: 8, marginRight: 8, marginBottom: 8};
      return (
        <div style={Object.assign(wrapperStyle, zeroPaddingRowFieldStyle)}>
          <MessageBar
            messageBarType={messageBarType}
            styles={{iconContainer: iconContainerStyle, text: textStyle}}
          >
            {statusText}
          </MessageBar>
        </div>
      );
    },
  });

  /**
   * @type {import('office-ui-fabric-react').IColumn}
   */
  const actionsColumn = {
    key: 'actions',
    name: 'Actions',
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
        <div style={zeroPaddingRowFieldStyle} data-selection-disabled>
          <ActionButton
            iconProps={{iconName: 'StopSolid'}}
            disabled={disabled}
            onClick={onClick}
          >
            Stop
          </ActionButton>
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
    statusColumn,
    actionsColumn,
  ];

  return (
    <ShimmeredDetailsList
      items={pagination.apply(ordering.apply(filteredJobs || []))}
      columns={columns}
      enableShimmer={allJobs === null}
      shimmerLines={pagination.itemsPerPage}
      checkboxVisibility={CheckboxVisibility.hidden}
    />
  );
}
