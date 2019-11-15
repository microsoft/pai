import { isNil } from 'lodash';
import { createTheme, FontClassNames } from '@uifabric/styling';
import { Stack, ThemeProvider } from 'office-ui-fabric-react';
import {
  DetailsList,
  SelectionMode,
  DetailsRow,
  DetailsListLayoutMode,
} from 'office-ui-fabric-react/lib/DetailsList';
import React, { useContext } from 'react';
import yaml from 'js-yaml';

import Card from './card';
import Context from './Context';

const theme = createTheme({
  palette: {
    themePrimary: '#0078d4',
    themeLighterAlt: '#eff6fc',
    themeLighter: '#deecf9',
    themeLight: '#c7e0f4',
    themeTertiary: '#71afe5',
    themeSecondary: '#2b88d8',
    themeDarkAlt: '#106ebe',
    themeDark: '#005a9e',
    themeDarker: '#004578',
    neutralLighterAlt: '#f1f1f1',
    neutralLighter: '#ededed',
    neutralLight: '#e3e3e3',
    neutralQuaternaryAlt: '#d3d3d3',
    neutralQuaternary: '#cacaca',
    neutralTertiaryAlt: '#c2c2c2',
    neutralTertiary: '#c2c2c2',
    neutralSecondary: '#858585',
    neutralPrimaryAlt: '#4b4b4b',
    neutralPrimary: '#333333',
    neutralDark: '#272727',
    black: '#1d1d1d',
    white: '#f8f8f8',
  },
});

const TaskRoles = () => {
  const { marketItem } = useContext(Context);

  function parseTaskRoles(jobConfig) {
    var items = [];
    var item = {};
    var key = 1;
    const lines = jobConfig.split('\n');
    let index = 0;
    while (index < lines.length) {
      if (lines[index].startsWith('taskRoles:')) {
        while (index < lines.length && !lines[index].startsWith('defaults:')) {
          if (lines[index - 1].startsWith('taskRoles:')) {
            item.key = key.toString();
            key += 1;
            item.name = lines[index].trim().split(':')[0];
          }
          if (lines[index].trim().startsWith('instances')) {
            const keyValue = lines[index].trim().split(': ');
            item.instances = keyValue[1];
          } else if (lines[index].trim().startsWith('dockerImage')) {
            const keyValue = lines[index].trim().split(': ');
            item.dockerImage = keyValue[1];
          } else if (lines[index].trim().startsWith('resourcePerInstance')) {
            item.resourcePerInstance =
              lines[index + 1].trim() +
              '\n' +
              lines[index + 2].trim() +
              '\n' +
              lines[index + 3].trim();
            index += 3;
          } else if (lines[index].trim().startsWith('commands')) {
            index += 1;
            item.commands = '';
            while (!lines[index].startsWith('defaults:')) {
              item.commands += lines[index].trim() + '\n';
              index += 1;
            }
            index -= 1;
            items.push(item);
          }
          index += 1;
        }
      }
      index += 1;
    }
    return items;
  }

  function getColumns() {
    const columns = [
      {
        key: 'number',
        name: 'No.',
        headerClassName: FontClassNames.medium,
        minWidth: 50,
        maxWidth: 50,
        isResizable: true,
        onRender: (item, idx) => {
          return (
            !isNil(idx) && (
              <div className={FontClassNames.mediumPlus}>{idx}</div>
            )
          );
        },
      },
      {
        key: 'name',
        name: 'name',
        fieldName: 'name',
        className: FontClassNames.mediumPlus,
        headerClassName: FontClassNames.mediumPlus,
        minWidth: 50,
        maxWidth: 70,
        isResizable: true,
      },
      {
        key: 'instances',
        name: 'instances',
        fieldName: 'instances',
        className: FontClassNames.mediumPlus,
        headerClassName: FontClassNames.mediumPlus,
        minWidth: 50,
        maxWidth: 70,
        isResizable: true,
      },
      {
        key: 'dockerImage',
        name: 'dockerImage',
        fieldName: 'dockerImage',
        className: FontClassNames.mediumPlus,
        headerClassName: FontClassNames.mediumPlus,
        minWidth: 100,
        maxWidth: 120,
        isResizable: true,
      },
      {
        key: 'resourcePerInstance',
        name: 'resourcePerInstance',
        fieldName: 'resourcePerInstance',
        className: FontClassNames.mediumPlus,
        headerClassName: FontClassNames.mediumPlus,
        minWidth: 100,
        maxWidth: 150,
        isResizable: true,

        onRender: item => {
          const resources = item.resourcePerInstance.split('\n');
          const stacks = [];
          for (var i = 0; i < resources.length; i++) {
            stacks.push(<Stack>{resources[i]}</Stack>);
          }
          return <Stack>{stacks}</Stack>;
        },
      },
      {
        key: 'commands',
        name: 'commands',
        fieldName: 'commands',
        className: FontClassNames.mediumPlus,
        headerClassName: FontClassNames.mediumPlus,
        minWidth: 100,
        maxWidth: 150,
        isResizable: true,
        onRender: item => {
          const commands = item.commands.split('\n');
          const stacks = [];
          for (var i = 0; i < commands.length; i++) {
            stacks.push(<Stack>{commands[i]}</Stack>);
          }
          return <Stack>{stacks}</Stack>;
        },
      },
    ];

    return columns;
  }

  function onRenderRow(props) {
    return (
      <DetailsRow
        {...props}
        styles={{
          root: {
            color: theme.palette.black,
          },
        }}
      />
    );
  }

  return (
    <Card style={{ marginTop: 15, marginLeft: 10 }}>
      <ThemeProvider theme={theme}>
        <DetailsList
          columns={getColumns()}
          disableSelectionZone
          items={parseTaskRoles(marketItem.jobConfig)}
          layoutMode={DetailsListLayoutMode.justified}
          selectionMode={SelectionMode.none}
          onRenderRow={onRenderRow}
        />
      </ThemeProvider>
    </Card>
  );
};

TaskRoles.contextType = Context;

export default TaskRoles;
