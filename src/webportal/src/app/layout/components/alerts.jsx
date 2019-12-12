// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
  Panel,
  List,
  mergeStyleSets,
  getFocusStyle,
  getTheme,
  PanelType,
  Stack,
  StackItem,
  Icon,
  IconFontSizes,
} from 'office-ui-fabric-react';
import React, { useCallback, useState, useEffect } from 'react';

import webportalConfig from '../../config/webportal.config';

const theme = getTheme();
const { palette, semanticColors, spacing } = theme;

const classNames = mergeStyleSets({
  itemCell: [
    getFocusStyle(theme, { inset: -1 }),
    {
      minHeight: 54,
      paddingBottom: 10,
      paddingTop: 10,
      boxSizing: 'border-box',
      borderBottom: `1px solid ${semanticColors.bodyDivider}`,
      display: 'flex',
      selectors: {
        '&:hover': { background: palette.neutralLight },
      },
    },
  ],
});

export const NotificationButton = () => {
  const [panelOpened, setPanelOpened] = useState(false);
  const [alertItems, setAlertItems] = useState([]);

  useEffect(() => {
    let canceled = false;
    const alertsUrl = `${webportalConfig.alertManagerUri}/api/v1/alerts?silenced=false`;
    const work = async () => {
      try {
        const result = await fetch(alertsUrl);
        if (!result.ok) {
          throw Error('Failed to get alert infos');
        }
        const data = await result.json().catch(() => {
          throw new Error('Get alerts json failed');
        });
        if (data.status !== 'success') {
          throw new Error('Failed to get alerts data');
        }
        if (!canceled) {
          setAlertItems(data.data);
        }
      } catch (err) {
        console.error(`Alerts Error: ${err.message}`);
        // Swallow exceptions here. Since alertManager is optional and we don't have an API to get all avaliable services
      }
    };
    work();
    return () => {
      canceled = true;
    };
  }, []);

  const open = useCallback(() => {
    setPanelOpened(true);
  }, []);
  const close = useCallback(() => {
    setPanelOpened(false);
  }, []);

  const renderNavigationContent = useCallback((props, defaultRender) => {
    return (
      <Stack
        horizontal
        styles={{
          root: {
            width: '100%',
            paddingTop: spacing.m,
            paddingLeft: spacing.m,
            borderBottom: `1px solid ${semanticColors.bodyDivider}`,
          },
        }}
      >
        <StackItem grow>
          <span>Alert</span>
        </StackItem>
        <StackItem>{defaultRender(props)}</StackItem>
      </Stack>
    );
  }, []);

  return (
    <div
      style={{
        cursor: 'pointer',
        height: '100%',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={open}
    >
      <div style={{ position: 'relative' }}>
        <Icon iconName='ringer' style={{ fontSize: IconFontSizes.medium }} />
        {alertItems.length !== 0 && (
          <span
            style={{
              height: '8px',
              width: '8px',
              backgroundColor: palette.red,
              borderRadius: '50%',
              position: 'absolute',
              top: '0px',
              left: '50%',
            }}
          />
        )}
      </div>
      <Panel
        isOpen={panelOpened}
        isLightDismiss={true}
        onDismiss={close}
        type={PanelType.smallFixedFar}
        onRenderNavigationContent={renderNavigationContent}
      >
        <List
          items={alertItems}
          onRenderCell={item => {
            return (
              <div className={classNames.itemCell} data-is-focusable={true}>
                {'Issue time: ' + new Date(item.startsAt).toLocaleString()}
                <br />
                {'Summary: ' + item.annotations.summary}
              </div>
            );
          }}
        />
      </Panel>
    </div>
  );
};
