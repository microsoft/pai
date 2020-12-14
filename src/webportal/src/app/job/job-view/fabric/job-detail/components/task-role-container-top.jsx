// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React, { useContext, getTheme } from 'react';
import {
  ColorClassNames,
  CommandBarButton,
  SearchBox,
  Stack,
} from 'office-ui-fabric-react';
import PropTypes from 'prop-types';

import Context from './context';
import TaskRoleFilter from './task-role-filter';
import FilterButton from '../../JobList/FilterButton';

function KeywordSearchBox() {
  const { filter, setFilter } = useContext(Context);

  function onKeywordChange(keyword) {
    const { statuses, exitType, exitCode, nodeName } = filter;
    const newFilter = new TaskRoleFilter(
      keyword,
      statuses,
      exitType,
      exitCode,
      nodeName,
    );
    setFilter(newFilter);
  }

  /** @type {import('office-ui-fabric-react').IStyle} */
  const rootStyles = {
    backgroundColor: 'transparent',
    alignSelf: 'center',
    width: 220,
  };
  return (
    <SearchBox
      underlined
      placeholder='Filter by keyword'
      styles={{ root: rootStyles }}
      value={filter.keyword}
      onChange={onKeywordChange}
    />
  );
}

export default function TaskRoleContainerTop({ taskStatuses }) {
  const { filter, setFilter } = useContext(Context);
  const exitTypes = new Set();
  const exitCodes = new Set();
  const nodeNames = new Set();

  for (const item of taskStatuses) {
    if (item.containerExitSpec && item.containerExitSpec.type) {
      exitTypes.add(item.containerExitSpec.type);
    }
    if (item.containerExitCode) {
      exitCodes.add(item.containerExitCode);
    }
    if (item.containerNodeName) {
      nodeNames.add(item.containerNodeName);
    }
  }

  const statuses = {
    Waiting: true,
    Succeeded: true,
    Running: true,
    Stopped: true,
    Failed: true,
  };

  const { spacing } = getTheme();

  return (
    <React.Fragment>
      <Stack
        horizontal
        verticalAlign='stretch'
        horizontalAlign='space-between'
        styles={{
          root: [
            ColorClassNames.neutralLightBackground,
            {
              marginTop: spacing.s2,
              padding: spacing.m,
            },
          ],
        }}
      >
        <KeywordSearchBox />
        <Stack horizontal>
          <FilterButton
            styles={{ root: { backgroundColor: 'transparent' } }}
            text='Status'
            iconProps={{ iconName: 'Clock' }}
            items={Object.keys(statuses)}
            selectedItems={Array.from(filter.statuses)}
            onSelect={statuses => {
              const { keyword, exitType, exitCode, nodeName } = filter;
              setFilter(
                new TaskRoleFilter(
                  keyword,
                  new Set(statuses),
                  exitType,
                  exitCode,
                  nodeName,
                ),
              );
            }}
            clearButton
          />
          <FilterButton
            styles={{ root: { backgroundColor: 'transparent' } }}
            text='exitType'
            iconProps={{ iconName: 'Tablet' }}
            items={Array.from(exitTypes)}
            selectedItems={Array.from(filter.exitType)}
            onSelect={exitTypes => {
              const { keyword, statuses, exitCode, nodeName } = filter;
              setFilter(
                new TaskRoleFilter(
                  keyword,
                  statuses,
                  new Set(exitTypes),
                  exitCode,
                  nodeName,
                ),
              );
            }}
            searchBox
            clearButton
          />
          <FilterButton
            styles={{ root: { backgroundColor: 'transparent' } }}
            text='exitCode'
            iconProps={{ iconName: 'NumberSymbol' }}
            items={Array.from(exitCodes)}
            selectedItems={Array.from(filter.exitCode)}
            onSelect={exitCodes => {
              const { keyword, statuses, exitType, nodeName } = filter;
              setFilter(
                new TaskRoleFilter(
                  keyword,
                  statuses,
                  exitType,
                  new Set(exitCodes),
                  nodeName,
                ),
              );
            }}
            searchBox
            clearButton
          />
          <FilterButton
            styles={{ root: { backgroundColor: 'transparent' } }}
            text='nodeName'
            iconProps={{ iconName: 'ConnectVirtualMachine' }}
            items={Array.from(nodeNames)}
            selectedItems={Array.from(filter.nodeName)}
            onSelect={nodeNames => {
              const { keyword, statuses, exitType, exitCode } = filter;
              setFilter(
                new TaskRoleFilter(
                  keyword,
                  statuses,
                  exitType,
                  exitCode,
                  new Set(nodeNames),
                ),
              );
            }}
            searchBox
            clearButton
          />
          <CommandBarButton
            styles={{
              root: { backgroundColor: 'transparent', height: '100%' },
            }}
            iconProps={{ iconName: 'Cancel' }}
            onClick={() => setFilter(new TaskRoleFilter())}
          />
        </Stack>
      </Stack>
    </React.Fragment>
  );
}

TaskRoleContainerTop.propTypes = {
  taskStatuses: PropTypes.array.isRequired,
};
