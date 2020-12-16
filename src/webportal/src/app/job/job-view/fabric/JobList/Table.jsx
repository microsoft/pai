import c from 'classnames';
import React, {useContext, useMemo, useLayoutEffect, useEffect, useState, useCallback} from 'react';
import {ColumnActionsMode, DefaultButton, FontClassNames, Link, mergeStyles, Selection, ShimmeredDetailsList, Icon, ColorClassNames, FontSizes, FontWeights} from 'office-ui-fabric-react';
import {SelectionMode} from 'office-ui-fabric-react/lib/DetailsList';
import {isNil, cloneDeep} from 'lodash';
import {DateTime} from 'luxon';

import {getFinished, getModified, getStarted, getStatusText, appendTimeZoneToDateTime} from './utils';
import Context from './Context';
import Filter from './Filter';
import Ordering from './Ordering';
import StatusBadge from '../../../../components/status-badge';
import {getJobDurationString} from '../../../../components/util/job';
import {setTableScrllbar, getDetectZoomRatio} from '../../../../spark-debugging/components/common/table/utils';
import {isValidClusterParameter} from '../../../../home/home/util';

import t from '../../../../components/tachyons.scss';
import '../../../../spark-debugging/components/common/table/table.css';

const zeroPaddingClass = mergeStyles({
  paddingTop: '0px !important',
  paddingLeft: '0px !important',
  paddingRight: '0px !important',
  paddingBottom: '0px !important',
});


export default function Table() {
  const {stopJob, filteredJobs, setSelectedJobs, filter, ordering, setOrdering, pagination, setFilter, allJobs, setAllJobs} = useContext(Context);
  const [tableHeight, setTableHeight] = useState($(`.content-wrapper .job-list-table`).parent().height() - 60);
  const [tableWidth, setTableWidth] = useState(getTableWidth);
  
  // workaround for fabric's bug
  // https://github.com/OfficeDev/office-ui-fabric-react/issues/5280#issuecomment-489619108
  useLayoutEffect(() => {
    window.dispatchEvent(new Event('resize'));
  });
  
  function layout() {
    // Set table scroll of position 
    setTableHeight($(`.content-wrapper .job-list-table`).parent().height() - 60);
    setTableWidth(getTableWidth);
  };
  
  window.addEventListener('resize', layout);

  const getTableWidth = useCallback(()=> {
    const BrowserResolution = 767;
    const bodyW = document.body.offsetWidth;
    return bodyW > 0 && bodyW <= BrowserResolution ? bodyW - 80 : bodyW - 310;
  });

  // Set table scroll of position 
  const setTable = useCallback(()=> {
    setTableScrllbar(20, '.job-list-table', tableHeight, tableWidth);
  });

  useEffect(()=> setTable(), [tableHeight, pagination, tableWidth]);

  useEffect(()=> setAllJobs(cloneDeep(allJobs)), [tableWidth]);


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
    minWidth: 250,
    name: 'Name',
    fieldName: 'name',
    className: FontClassNames.medium,
    headerClassName: FontClassNames.medium,
    isResizable: true,
    isFiltered: filter.keyword !== '',
    onRender(job) {
      const {name, appId, username, jobDetailLink} = job;
      const href = `${jobDetailLink}`;
      return <Link href={href}>{name}</Link>;
    },
  });
  
  const groupColumn = applySortProps({
    key: 'groupId',
    minWidth: 250,
    name: 'Group Id',
    fieldName: 'groupId',
    className: FontClassNames.medium,
    headerClassName: FontClassNames.medium,
    isResizable: true,
    isFiltered: filter.keyword !== '',
  });

  const appIdColumn = applySortProps({
    key: 'appId',
    minWidth: 220,
    name: 'Application Id',
    fieldName: 'appId',
    className: FontClassNames.medium,
    headerClassName: FontClassNames.medium,
    isResizable: true,
    isFiltered: filter.keyword !== '',
  });

  const startedColumn = applySortProps({
    key: 'started',
    minWidth: 200,
    name: 'Submission Time',
    className: FontClassNames.medium,
    headerClassName: FontClassNames.medium,
    isResizable: true,
    isSorted: ordering.field === 'started',
    isSortedDescending: !ordering.descending,
    onRender(job) {
      return appendTimeZoneToDateTime(DateTime.fromJSDate(getStarted(job)), DateTime.DATETIME_MED_WITH_SECONDS);
    },
  });

  const finishedColumn =  applySortProps({
    key: 'finished',
    minWidth: 200,
    name: 'Finish Time',
    className: FontClassNames.medium,
    headerClassName: FontClassNames.medium,
    isResizable: true,
    onRender(job) {
      return getFinished(job);
    },
  });

  const userColumn = applySortProps({
    key: 'user',
    minWidth: 80,
    name: 'User',
    fieldName: 'username',
    className: FontClassNames.medium,
    headerClassName: FontClassNames.medium,
    isResizable: true,
    isFiltered: filter.users.size > 0,
  });
  const durationColumn = applySortProps({
    key: 'duration',
    minWidth: 100,
    name: 'Duration',
    className: FontClassNames.medium,
    headerClassName: FontClassNames.medium,
    isResizable: true,
    onRender(job) {
      return getJobDurationString(job);
    },
  });
  const virtualClusterColumn = applySortProps({
    key: 'virtualCluster',
    minWidth: 100,
    name: 'Virtual Cluster',
    fieldName: 'virtualCluster',
    className: FontClassNames.medium,
    headerClassName: FontClassNames.medium,
    isResizable: true,
    isFiltered: filter.virtualClusters.size > 0,
  });
  const allocatedMBColumn = applySortProps({
    key: 'allocatedMB',
    minWidth: 100,
    name: 'Allocated MemoryMB',
    fieldName: 'allocatedMB',
    className: FontClassNames.medium,
    headerClassName: FontClassNames.medium,
    isResizable: true,
  });
  const allocatedVCoresColumn = applySortProps({
    key: 'allocatedVCores',
    minWidth: 100,
    name: 'Allocated CPU VCores',
    fieldName: 'allocatedVCores',
    className: FontClassNames.medium,
    headerClassName: FontClassNames.medium,
    isResizable: true,
  });
  const priorityColumn = applySortProps({
    key: 'priority',
    minWidth: 100,
    name: 'Priority',
    fieldName: 'priority',
    className: FontClassNames.medium,
    headerClassName: FontClassNames.medium,
    isResizable: true,
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
    className: FontClassNames.medium,
    headerClassName: FontClassNames.medium,
    isResizable: true,
  });
  const gpuCountColumn = applySortProps({
    key: 'gpuCount',
    minWidth: 60,
    name: 'GPUs',
    fieldName: 'totalGpuNumber',
    className: FontClassNames.medium,
    headerClassName: FontClassNames.medium,
    isResizable: true,
  });
  const appProgressColumn = applySortProps({
    key: 'appProgress',
    minWidth: 80,
    name: 'Progress',
    fieldName: 'applicationProgress',
    className: FontClassNames.medium,
    headerClassName: FontClassNames.medium,
    isResizable: true,
  });
  const jobTypeColumn = applySortProps({
    key: 'jobType',
    minWidth: 80,
    name: 'Job Type',
    fieldName: 'jobType',
    className: FontClassNames.medium,
    headerClassName: FontClassNames.medium,
    isResizable: true,
    isFiltered: filter.jobType.size > 0,
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
              rootDisabled: {backgroundColor: '#eeeeee'},
              rootCheckedDisabled: {backgroundColor: '#eeeeee'},
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
    appIdColumn,
    jobTypeColumn,
    userColumn,
    statusColumn,
    startedColumn,
    durationColumn,
    finishedColumn,
    groupColumn,
    virtualClusterColumn,
    allocatedMBColumn,
    allocatedVCoresColumn,
    priorityColumn,
    appProgressColumn,
  ];
  


  if ((!isNil(filteredJobs) && filteredJobs.length === 0) || !isValidClusterParameter(true)) {
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
      <div className= 'job-list-table'>
        <ShimmeredDetailsList
        items={items}
        setKey="key"
        columns={columns}
        enableShimmer={isNil(filteredJobs)}
        shimmerLines={pagination.itemsPerPage}
        selectionMode={SelectionMode.single}
        selection={selection}
        onColumnResize={setTable}
      />
      </div>
    );
  }
}
