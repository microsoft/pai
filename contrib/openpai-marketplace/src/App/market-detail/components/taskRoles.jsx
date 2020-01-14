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
import Context from '../Context';

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

  function getTaskRoles() {
    var items = [];
    var item = {};
    const taskRoles = yaml.load(marketItem.jobConfig).taskRoles;
    for (const taskRole in taskRoles) {
      item.name = taskRole;
      item.instances = taskRoles[taskRole].instances;
      item.dockerImage = taskRoles[taskRole].dockerImage;
      item.resourcePerInstance = taskRoles[taskRole].resourcePerInstance;
      item.commands = taskRoles[taskRole].commands;
      items.push(item);
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
          const resources = item.resourcePerInstance;
          const stacks = [];
          for (const key in resources) {
            stacks.push(
              <Stack key={key}>
                {key}: {resources[key]}
              </Stack>,
            );
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
          const commands = item.commands;
          const stacks = [];
          commands.map((command, idx) => {
            stacks.push(<Stack key={idx}>{command}</Stack>);
          });
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
    <Card style={{ paddingTop: 15, paddingLeft: 10 }}>
      <ThemeProvider theme={theme}>
        <DetailsList
          columns={getColumns()}
          disableSelectionZone
          items={getTaskRoles()}
          layoutMode={DetailsListLayoutMode.justified}
          selectionMode={SelectionMode.none}
          onRenderRow={onRenderRow}
        />
      </ThemeProvider>
    </Card>
  );
};

export default TaskRoles;
