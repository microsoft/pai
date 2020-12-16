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
import ExampleDetail from '../ExampleDetail'
import ModuleDetail from '../../module/ModuleDetail';
import ExampleManagement from '../ExampleManagement'
import JobSubmit from '../../mt-job-submission/mt-job-submission'
import { extractUriFromStr } from '../util/tool'
import { Spinner, SpinnerSize } from 'office-ui-fabric-react/lib/Spinner';

import t from '../../components/tachyons.scss';
const htmlParse = require('html-react-parser');

const zeroPaddingClass = mergeStyles({
  paddingTop: '0px !important',
  paddingLeft: '0px !important',
  paddingRight: '0px !important',
  paddingBottom: '0px !important',
});

export default function Table() {
  const {initialized, filteredExamples, selectedExample, setSelectedExample, filter, ordering, setOrdering, pagination, allExamples,
        setFilter, setAllExamples, moduleDict, showExampleCreate, setShowExampleCreate} = useContext(Context);
  const [tableHeight, setTableHeight] = useState(($(`.content-wrapper .example-list-table`).parent().height() - 60));
  const [tableWidth, setTableWidth] = useState(getTableWidth);
  const [showExampleDetail, setShowExampleDetail] = useState(false);
  const [showModuleDetail, setShowModuleDetail] = useState(false);
  const [showJobSubmit, setShowJobSubmit] = useState(false);

  // workaround for fabric's bug
  // https://github.com/OfficeDev/office-ui-fabric-react/issues/5280#issuecomment-489619108
  useLayoutEffect(() => {
    window.dispatchEvent(new Event('resize'));
  });
  
  window.addEventListener('resize', layout);

  function layout() {
    // Set table scroll of position 
    setTableHeight($(`.content-wrapper .example-list-table`).parent().height() - 60);
    setTableWidth(getTableWidth);
  };

  const getTableWidth = useCallback(()=> {
    const BrowserResolution = 767;
    const bodyW = document.body.offsetWidth;
    return bodyW > 0 && bodyW <= BrowserResolution ? bodyW - 80 : bodyW - 310;
  });

  // Set table scroll of position 
  const setTable = useCallback(()=> {
    setTableScrllbar(20, '.example-list-table', tableHeight, tableWidth);
  });

  useEffect(()=> setTable(), [tableHeight, pagination, tableWidth]);

  useEffect(()=> setAllExamples(cloneDeep(allExamples)), [tableWidth]);

  /**
   * @type {import('office-ui-fabric-react').Selection}
   */
  const selection = useMemo(() => {
    return new Selection({
      onSelectionChanged() {
        setSelectedExample(selection.getSelection()[0]);
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
    maxWidth: 300,
    isMultiline: true,
    name: 'Name',
    className: FontClassNames.medium,
    headerClassName: FontClassNames.medium,
    isResizable: true,
    isFiltered: filter.keyword !== '',
    onRender(example) {
      function onClick(event) {
         setShowExampleDetail(true);
      }
      return <Link onClick={onClick}>{example.info.name}</Link>;
    },
  });

  const descriptionColumn = applySortProps({
    key: 'description',
    minWidth: 300,
    isMultiline: true,
    name: 'Description',
    onRender(example) {
        let uriList = new Set(extractUriFromStr(example.info.description));
        let describeValue = example.info.description;
        if (uriList) {
          uriList.forEach(element => {
            describeValue = describeValue.replace(element, `<a target="_blank" href="${element}">source code</a>`);
          });
        }
      return htmlParse(describeValue);
    },
    className: FontClassNames.medium,
    headerClassName: FontClassNames.medium,
    isResizable: true,
    isFiltered: filter.keyword !== '',
  });

  const groupColumn = applySortProps({
    key: 'group',
    minWidth: 100,
    name: 'Group',
    onRender(example) {
        return <span>{example.info.group}</span>;
    },
    className: FontClassNames.medium,
    headerClassName: FontClassNames.medium,
    isResizable: true,
    isFiltered: filter.keyword !== '',
  });

  const categoryColumn = applySortProps({
    key: 'category',
    minWidth: 180,
    name: 'Category',
    onRender(example) {
        return <span>{example.info.category}</span>;
    },
    className: FontClassNames.medium,
    headerClassName: FontClassNames.medium,
    isResizable: true,
    isFiltered: filter.keyword !== '',
  });

  const moduleColumn = applySortProps({
    key: 'module',
    minWidth: 300,
    isMultiline: true,
    name: 'Module',
    onRender(example) {
      function onClick(event) {
        setShowModuleDetail(true);
      }
      let moduleInfo = moduleDict[example.info.moduleId];
      if (moduleInfo) {
        return <Link onClick={onClick}>{`${moduleInfo.name} : ${moduleInfo.version}`}</Link>;
      } else {
        return <span>module undefined</span>;
      }
    },
    className: FontClassNames.medium,
    headerClassName: FontClassNames.medium,
    isResizable: true,
    isFiltered: filter.keyword !== '',
  });

  const submitActionsColumn = {
    key: 'submitAction',
    minWidth: 100,
    name: 'Actions',
    headerClassName: FontClassNames.medium,
    className: zeroPaddingClass,
    columnActionsMode: ColumnActionsMode.disabled,
    onRender(example) {
      function onClick(event) {
        console.log(example)
        setSelectedExample(example);
        setShowJobSubmit(true);
      }
      return (
        <div style={{height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'left'}} data-selection-disabled>
          <DefaultButton
            styles={{
              root: {backgroundColor: '#e5e5e5'},
              rootFocused: {backgroundColor: '#e5e5e5'},
              rootDisabled: {backgroundColor: '#eeeeee'},
              rootCheckedDisabled: {backgroundColor: '#eeeeee'}
            }}
            onClick={onClick}
          >
            Submit
          </DefaultButton>
        </div>
      );
    },
  };

  const columns = [
    nameColumn,
    descriptionColumn,
    groupColumn,
    categoryColumn,
    moduleColumn,
    submitActionsColumn
  ];

  if (!isNil(filteredExamples) && filteredExamples.length === 0 && initialized) {
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
    const items = pagination.apply(ordering.apply(filteredExamples || [], moduleDict));
    return (
      <div className= 'example-list-table'>
        <ShimmeredDetailsList
        items={items}
        setKey="info"
        columns={columns}
        enableShimmer={isNil(filteredExamples)}
        shimmerLines={pagination.itemsPerPage}
        selectionMode={SelectionMode.single}
        selection={selection}
      />
      {
        showExampleDetail? 
        <Stack>
            <ExampleDetail
               moduleDict={moduleDict}
               exampleData={selectedExample}
               moduleData={moduleDict[selectedExample.info.moduleId]}
               setShowExampleDetail={setShowExampleDetail}
         />
        </Stack>
        : null
      }
     {
        showJobSubmit? 
        <Stack>
           <JobSubmit 
               exampleData={selectedExample}
               moduleMetadata={moduleDict[selectedExample.info.moduleId]}
               setShowJobSubmitPage={setShowJobSubmit}
           />
        </Stack>
        : null
      }
     {
        showExampleCreate? 
        <Stack>
           <ExampleManagement
               setShowExampleManagement={setShowExampleCreate}
               moduleDict={moduleDict}
               ActionType="Create"
           />
        </Stack>
        : null
      }
      {
        showModuleDetail? 
        <Stack>
          <ModuleDetail 
            selectedModule={moduleDict[selectedExample.info.moduleId]}
            setShowModuleDetail={setShowModuleDetail}
            exampleData={selectedExample}
          />
        </Stack>
        : null
      }
      </div>
    );
  }
}
