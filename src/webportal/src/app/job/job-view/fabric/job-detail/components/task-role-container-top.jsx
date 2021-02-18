// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React from 'react';
import { getTheme } from '@uifabric/styling';
import {
  ColorClassNames,
  CommandBarButton,
  SearchBox,
  Stack,
} from 'office-ui-fabric-react';
import PropTypes from 'prop-types';
import TaskRoleFilter from './task-role-filter';
import FilterButton from '../../JobList/FilterButton';
import TaskRoleCsvExporter from './task-role-csv-exporter';

function KeywordSearchBox({ filter, setFilter }) {
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

KeywordSearchBox.propTypes = {
  filter: PropTypes.object.isRequired,
  setFilter: PropTypes.func.isRequired,
};

export default function TaskRoleContainerTop({
  taskStatuses,
  filter,
  setFilter,
  taskRoleName,
}) {
  const exitTypes = new Set();
  const exitCodes = new Set();
  const nodeNames = new Set();

  for (const item of taskStatuses) {
    if (item.containerExitSpec && item.containerExitSpec.type) {
      exitTypes.add(item.containerExitSpec.type);
    }
    if (item.containerExitCode) {
      exitCodes.add(item.containerExitCode.toString());
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
  const csvExporter = new TaskRoleCsvExporter();
  const expCsv = () => csvExporter.apply(taskRoleName + '.csv', taskStatuses);

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
        <Stack horizontal>
          <KeywordSearchBox filter={filter} setFilter={setFilter} />
          <CommandBarButton
            iconProps={{ iconName: 'ExcelDocument' }}
            text='Export CSV'
            onClick={expCsv}
          />
        </Stack>
        <Stack horizontal>
          <FilterButton
            styles={{ root: { backgroundColor: 'transparent' } }}
            text='Status'
            iconProps={{ iconName: 'Clock' }}
            items={Object.keys(statuses)}
            selectedItems={Array.from(filter.statuses)}
            onSelect={(statuses) => {
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
            text='Exit Type'
            iconProps={{ iconName: 'Tablet' }}
            items={Array.from(exitTypes)}
            selectedItems={Array.from(filter.exitType)}
            onSelect={(exitTypes) => {
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
            text='Exit Code'
            iconProps={{ iconName: 'NumberSymbol' }}
            items={Array.from(exitCodes)}
            selectedItems={Array.from(filter.exitCode)}
            onSelect={(exitCodes) => {
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
            text='Node Name'
            iconProps={{ iconName: 'TVMonitor' }}
            items={Array.from(nodeNames)}
            selectedItems={Array.from(filter.nodeName)}
            onSelect={(nodeNames) => {
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
  filter: PropTypes.object.isRequired,
  setFilter: PropTypes.func.isRequired,
  taskRoleName: PropTypes.string.isRequired,
};
