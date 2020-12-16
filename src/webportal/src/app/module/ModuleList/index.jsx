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
import {Stack} from 'office-ui-fabric-react/lib/Stack';

import Context from './Context';
import Filter from './Filter';
import Ordering from './Ordering';
import Pagination from './Pagination';
import Paginator from './Paginator';
import Table from './Table';
import TopBar from './TopBar';
import {defaultRestServerClient} from '../../common/http-client';
import {initTheme} from '../../components/theme';

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

export default function ModuleList() {

  const [allModules, setAllModules] = useState(null);
  const [selectedModules, setSelectedModules] = useState([]);
  const [error, setError] = useState(null);
  const [filteredModules, setFilteredModules] = useState(null);
  const [moduleDetail, setModuleDetail] = useState(null);
  const [initialized, setInitialized] = useState(false);

  const initialFilter = useMemo(() => {
    let filter = new Filter();
    filter.load();
    return filter;
  });

  const [filter, setFilter] = useState(initialFilter);
  const [ordering, setOrdering] = useState(new Ordering('status'));
  const [pagination, setPagination] = useState(new Pagination());

  useEffect(() => filter.save(), [filter]);

  const {current: applyFilter} = useRef(debounce((allModules, filter) => {
    if (isNil(allModules)) {
      setFilteredModules(null);
    } else {
      setFilteredModules(filter.apply(allModules));
    }
  }, 200));

  useEffect(() => {
    applyFilter(allModules, filter);
  }, [applyFilter, allModules, filter]);

  useEffect(() => {
    setPagination(new Pagination(pagination.itemsPerPage, 0));
  }, [allModules]);

  const refreshModules = useCallback(function refreshModules() {
    setAllModules(null);
    let moduleListUri = '/api/v2/mp/modules';
    defaultRestServerClient.get(moduleListUri).then((response) => {
      if (response.data.moduleList.length > 0) {
        setInitialized(true);
      }
      setAllModules(response.data.moduleList);
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

  useEffect(refreshModules, []);

  const context = {
    allModules,
    setAllModules,
    refreshModules,
    filteredModules,
    selectedModules,
    setSelectedModules,
    filter,
    setFilter,
    ordering,
    setOrdering,
    pagination,
    setPagination,
    moduleDetail,
    setModuleDetail,
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
