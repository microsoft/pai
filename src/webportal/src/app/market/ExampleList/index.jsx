// Copyright (c) Microsoft Corporation
// All rights reserved.
//
// MIT License
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
// documentation files (the "Software"), to deal in the Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
// to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
// BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

import * as querystring from 'querystring';

import React, {useState, useMemo, useCallback, useEffect, useRef} from 'react';
import {debounce, isEmpty, isNil} from 'lodash';

import {ColorClassNames, getTheme} from '@uifabric/styling';
import {initializeIcons} from 'office-ui-fabric-react/lib/Icons';
import {Fabric} from 'office-ui-fabric-react/lib/Fabric';
import {MessageBar, MessageBarType} from 'office-ui-fabric-react/lib/MessageBar';
import {Overlay} from 'office-ui-fabric-react/lib/Overlay';
import {Stack, StackItem} from 'office-ui-fabric-react/lib/Stack';
import Context from './Context';
import TopBar from './TopBar';
import Table from './Table';
import Pagination from './Pagination';
import Paginator from './Paginator';
import CardList from './CardList';
import Ordering from './Ordering';
import Filter from './Filter';
import { ScrollablePane } from 'office-ui-fabric-react/lib/ScrollablePane';
import {initTheme} from '../../components/theme';
import {defaultRestServerClient} from '../../common/http-client';

initTheme();
initializeIcons();

function getError(error) {
  return (
    <Overlay>
      <div className={ColorClassNames.whiteBackground}>
        <MessageBar messageBarType={MessageBarType.blocked}>
          {error}
        </MessageBar>
      </div>
    </Overlay>
  );
}

export default function ExampleList() {

    const [allExamples, setAllExamples] = useState(null);
    const [allCategories, setAllCategories] = useState(new Set());
    const [allGroups, setAllGroups] = useState(new Set());
    const [filteredExamples, setFilteredExamples] = useState(null);
    const [moduleDict, setModuleDict] = useState(null);
    const [ordering, setOrdering] = useState(new Ordering('category'));
    const [pagination, setPagination] = useState(new Pagination());
    const [error, setError] = useState(null);
    const [selectedExample, setSelectedExample] = useState(null);
    const [showExampleCreate, setShowExampleCreate] = useState(false);
    const [moduleIdList, setModuleIdList] = useState(null);
    const [initialized, setInitialezed] = useState(false);
  
    const initialFilter = useMemo(() => {
      let filter = new Filter();
      return filter;
    });
  
    const [filter, setFilter] = useState(initialFilter);
  
    const {current: applyFilter} = useRef(debounce((allExamples, moduleDict, filter) => {
      if (isNil(allExamples)) {
          setFilteredExamples(null);
      } else {
          setFilteredExamples(filter.apply(ordering.apply(allExamples, moduleDict), moduleDict));
      }
    }, 200));
  
    useEffect(() => {
      applyFilter(allExamples, moduleDict, filter);
    }, [applyFilter, allExamples, filter]);

    useEffect(() => {
      setPagination(new Pagination(pagination.itemsPerPage, 0));
    }, [allExamples]);

    const refreshExamples = useCallback(function refreshExamples() {
        let exampleListUri = '/api/v2/mp/examples';
        defaultRestServerClient.get(exampleListUri).then((response) => {
          let exampleResponse = response.data;
          let moduleListUri = '/api/v2/mp/modules';
          defaultRestServerClient.get(moduleListUri).then((response) => {
            let moduleList = response.data.moduleList;
            if (moduleList.length > 0) {
              setInitialezed(true);
            }
            let tempModuleDict = {};
            if (moduleList) {
                for (let module of moduleList) {
                    tempModuleDict[module.id] = module;     
                }
            }
            setModuleDict(tempModuleDict);
            setAllExamples(exampleResponse.data);
            let categoryDict = {};
            for(let data of exampleResponse.data) {
              categoryDict[data.info.category] = true;
            }
            setAllCategories(categoryDict);
            let groupDict = {};
            for(let data of exampleResponse.data) {
              groupDict[data.info.group] = true;
            }
            setAllGroups(groupDict);
          }).catch((err) => {
              if (err.response) {
                setError(err.response.data.message);
                setTimeout(setError, 1000, null);
              } else {
                setError(err.message);
                setTimeout(setError, 1000, null);
              }
          });
        }).catch((err) => {
          if (err.response) {
            setError(err.response.data.message);
            setTimeout(setError, 1000, null);
          } else {
            setError(err.message);
            setTimeout(setError, 1000, null);
          }
        });
    }, []);

    useEffect(refreshExamples, []);

    const context = {
        allExamples,
        setAllExamples,
        refreshExamples,
        filteredExamples,
        filter,
        setFilter,
        allCategories,
        allGroups,
        moduleDict,
        setModuleDict,
        ordering,
        setOrdering,
        pagination,
        setPagination,
        selectedExample,
        setSelectedExample,
        showExampleCreate,
        setShowExampleCreate,
        initialized,
      };

    const {spacing} = getTheme();
    return (
      <Context.Provider value={context}>
        <Fabric style={{height: '100%'}}>
          <Stack
            verticalFill
            styles={{root: {position: 'relative', padding: `${spacing.s1} ${spacing.l1} ${spacing.l1}`}}}
          >
            <Stack.Item>
              <TopBar/>
            </Stack.Item>
            <Stack.Item>
              <div style={{height: spacing.s1}}></div>
            </Stack.Item>
            <Stack.Item grow styles={{root: {height: 0, backgroundColor: 'white', padding: spacing.l1}}}>
              <Table/>
            </Stack.Item>
            <Stack.Item styles={{root: {backgroundColor: 'white', paddingBottom: spacing.l1}}}>
              <Paginator/>
            </Stack.Item>
            {error !== null ? getError(error) : null}
          </Stack>
        </Fabric>
      </Context.Provider>
    );
}