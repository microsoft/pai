
import { ThemeProvider } from '@uifabric/foundation';
import {
  createTheme,
  ColorClassNames,
  FontClassNames,
  FontSizes,
  getTheme,
} from '@uifabric/styling';
import c from 'classnames';
import { capitalize, isEmpty, isNil, flatten } from 'lodash';
import {
  CommandBarButton,
  PrimaryButton,
  TooltipHost,
  DirectionalHint,
  Icon,
  Stack,
  IconButton,
} from 'office-ui-fabric-react';
import {
  DetailsList,
  SelectionMode,
  DetailsRow,
  DetailsListLayoutMode,
} from 'office-ui-fabric-react/lib/DetailsList';
import React, { useContext } from 'react';

import localCss from '../../job/job-view/fabric/job-detail/components/task-role-container-list';
import t from '../../components/tachyons.scss';

import { parseGpuAttr } from '../../job/job-view/fabric/job-detail/util';
import config from '../../config/webportal.config';
import StatusBadge from '../../components/status-badge';
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
  const {taskRoles} = useContext(Context);

  function getColumns() {
    const columns = [
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
        key: 'completion',
        name: 'completion',
        fieldName: 'completion',
        className: FontClassNames.mediumPlus,
        headerClassName: FontClassNames.mediumPlus,
        minWidth: 100,
        maxWidth: 200,
        isResizable: true,
        onRender: item => {
          const completions = item.completion.split("\n");
          const stacks = [];
          for (var i = 0; i < completions.length; i ++) {
            stacks.push(<Stack>{completions[i]}</Stack>);
            //console.log(completions[i]);
          }
          return (
            <Stack>
              {stacks}
            </Stack>
          );
        }
      },
      {
        key: 'taskRetryCount',
        name: 'taskretryCount',
        fieldName: 'taskRetryCount',
        className: FontClassNames.mediumPlus,
        headerClassName: FontClassNames.mediumPlus,
        minWidth: 80,
        maxWidth: 100,
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
          const resources = item.resourcePerInstance.split("\n");
          const stacks = [];
          for (var i = 0; i < resources.length; i ++) {
            stacks.push(<Stack>{resources[i]}</Stack>);
          }
          return (
            <Stack>
              {stacks}
            </Stack>
          );
        }
        
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
          const commands = item.commands.split("\n");
          const stacks = [];
          for (var i = 0; i < commands.length; i ++) {
            stacks.push(<Stack>{commands[i]}</Stack>);
          }
          return (
            <Stack>
              {stacks}
            </Stack>
          );
        }
      },
    ];

    return columns;
  }

  const items = [
    {
      key: '1',
      instances: 1,
      completion: `minFailedInstances: 1
      minSucceededInstances: 1`,
      taskRetryCount: 0,
      dockerImage: 'docker_image_0',
      resourcePerInstance: `gpu: 1
      cpu: 4
      memoryMB: 8194`,
      commands: `- 'git clone https://github.com/debuggy/marketplace-minist-example.git'
      - cd marketplace-minist-example
      - python download.py
      - python softmax_regression.py
      - python convolutional.py'`,
    }
  ];

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
      <Card>
          <DetailsList
            columns={getColumns()}
            disableSelectionZone
            items={items}
            layoutMode={DetailsListLayoutMode.justified}
            selectionMode={SelectionMode.none}
            onRenderRow={onRenderRow}
          />
      </Card>
  );
};

TaskRoles.contextType = Context;

export default TaskRoles;