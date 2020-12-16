import c from 'classnames';
import React, {useContext, useMemo, useLayoutEffect, useEffect, useState, useCallback} from 'react';
import {ColumnActionsMode, DefaultButton, FontClassNames, Link, mergeStyles, Selection, ShimmeredDetailsList, Icon, ColorClassNames, FontSizes, FontWeights, Stack} from 'office-ui-fabric-react';
import {SelectionMode} from 'office-ui-fabric-react/lib/DetailsList';
import {isNil, cloneDeep} from 'lodash';
import {DateTime} from 'luxon';

import Context from './Context';
import Filter from './Filter';
import Ordering from './Ordering';
import StatusBadge from '../../components/status-badge';
import {getJobDurationString} from '../../components/util/job';
import {setTableScrllbar} from '../../spark-debugging/components/common/table/utils';
import {isValidClusterParameter} from '../../home/home/util';
import ModuleDetail from '../ModuleDetail'
import JobSubmit from '../../mt-job-submission/mt-job-submission'
import { Spinner, SpinnerSize } from 'office-ui-fabric-react/lib/Spinner';

import t from '../../components/tachyons.scss';

const zeroPaddingClass = mergeStyles({
  paddingTop: '0px !important',
  paddingLeft: '0px !important',
  paddingRight: '0px !important',
  paddingBottom: '0px !important',
});

export default function Table() {
  const {initialized, filteredModules, selectedModules, setSelectedModules, filter, ordering, setOrdering, pagination, allModules, setFilter, setAllModules} = useContext(Context);
  const [tableHeight, setTableHeight] = useState(($(`.content-wrapper .module-list-table`).parent().height() - 60));
  const [tableWidth, setTableWidth] = useState(getTableWidth);
  const [showModuleDetail, setShowModuleDetail] = useState(false);
  const [showModuleSubmit, setShowModuleSubmit] = useState(false);

  // workaround for fabric's bug
  // https://github.com/OfficeDev/office-ui-fabric-react/issues/5280#issuecomment-489619108
  useLayoutEffect(() => {
    window.dispatchEvent(new Event('resize'));
  });
  
  window.addEventListener('resize', layout);

  function layout() {
    // Set table scroll of position 
    setTableHeight($(`.content-wrapper .module-list-table`).parent().height() - 60);
    setTableWidth(getTableWidth);
  };

  const getTableWidth = useCallback(()=> {
    const BrowserResolution = 767;
    const bodyW = document.body.offsetWidth;
    return bodyW > 0 && bodyW <= BrowserResolution ? bodyW - 80 : bodyW - 310;
  });

  // Set table scroll of position 
  const setTable = useCallback(()=> {
    setTableScrllbar(20, '.module-list-table', tableHeight, tableWidth);
  });

  useEffect(()=> setTable(), [tableHeight, pagination, tableWidth]);

  useEffect(()=> setAllModules(cloneDeep(allModules)), [tableWidth]);

  /**
   * @type {import('office-ui-fabric-react').Selection}
   */
  const selection = useMemo(() => {
    return new Selection({
      onSelectionChanged() {
        setSelectedModules(selection.getSelection());
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

  const idColumn = applySortProps({
    key: 'id',
    minWidth: 150,
    isMultiline: true,
    name: 'ID',
    fieldName: 'id',
    className: FontClassNames.medium,
    headerClassName: FontClassNames.medium,
    isResizable: true,
    isFiltered: filter.keyword !== '',
  });

  const nameColumn = applySortProps({
    key: 'name',
    minWidth: 250,
    maxWidth: 300,
    isMultiline: true,
    name: 'Name',
    fieldName: 'name',
    className: FontClassNames.medium,
    headerClassName: FontClassNames.medium,
    isResizable: true,
    isFiltered: filter.keyword !== '',
    onRender(module) {
      function onClick(event) {
         setShowModuleDetail(true);
      }
      const {name} = module;
      return <Link onClick={onClick}>{name}</Link>;
    },
  });

  const descriptionColumn = applySortProps({
    key: 'description',
    minWidth: 300,
    isMultiline: true,
    name: 'Description',
    fieldName: 'description',
    className: FontClassNames.medium,
    headerClassName: FontClassNames.medium,
    isResizable: true,
    isFiltered: filter.keyword !== '',
  });

  const categoryColumn = applySortProps({
    key: 'category',
    minWidth: 100,
    name: 'Category',
    fieldName: 'category',
    className: FontClassNames.medium,
    headerClassName: FontClassNames.medium,
    isResizable: true,
    isFiltered: filter.keyword !== '',
  });

  const versionColumn = applySortProps({
    key: 'version',
    minWidth: 100,
    name: 'Version',
    fieldName: 'version',
    className: FontClassNames.medium,
    headerClassName: FontClassNames.medium,
    isResizable: true,
    isFiltered: filter.keyword !== '',
  });

  const ownerColumn = applySortProps({
    key: 'owner',
    minWidth: 100,
    name: 'Owner',
    fieldName: 'owner',
    className: FontClassNames.medium,
    headerClassName: FontClassNames.medium,
    isResizable: true,
    isFiltered: filter.keyword !== '',
  });

  const statusColumn = applySortProps({
    key: 'status',
    minWidth: 100,
    name: 'State',
    fieldName: 'status',
    className: FontClassNames.medium,
    headerClassName: FontClassNames.medium,
    isResizable: true,
    isFiltered: filter.keyword !== '',
  });

  const columns = [
    nameColumn,
    descriptionColumn,
    categoryColumn,
    versionColumn,
    ownerColumn,
    statusColumn,
    idColumn
  ];

  if (!isNil(filteredModules) && filteredModules.length === 0 && initialized) {
    return (
      <div className={c(t.h100, t.flex, t.itemsCenter, t.justifyCenter)}>
        <div className={c(t.tc)}>
          <div>
            <Icon className={c(ColorClassNames.themePrimary)} style={{fontSize: FontSizes.xxLarge}} iconName='Error' />
          </div>
          <div className={c(t.mt5, FontClassNames.xLarge)} style={{fontWeight: FontWeights.semibold}}>
            No results matched your search.
          </div>
        </div>
      </div>
    );
  } else if (!initialized) {
    return (
      <div className={c(t.h100, t.flex, t.itemsCenter, t.justifyCenter)}>
          <Spinner size={SpinnerSize.large} ariaLive="assertive" />
      </div>
    );
  } else {
    const items = pagination.apply(ordering.apply(filteredModules || []));
    
    return (
      <div className= 'module-list-table'>
        <ShimmeredDetailsList
        items={items}
        setKey="key"
        columns={columns}
        enableShimmer={isNil(filteredModules)}
        shimmerLines={pagination.itemsPerPage}
        selectionMode={SelectionMode.single}
        selection={selection}
      />
      {
        showModuleDetail? 
        <Stack>
           <ModuleDetail 
               selectedModule={selectedModules[0]}
               setShowModuleDetail={setShowModuleDetail}
           />
        </Stack>
        : null
      }
      </div>
    );
  }
}
