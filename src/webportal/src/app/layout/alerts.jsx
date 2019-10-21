import c from 'classnames';
import {
  Panel,
  List,
  mergeStyleSets,
  getFocusStyle,
  getTheme,
  PanelType,
  Stack,
  StackItem,
} from 'office-ui-fabric-react';
import React, { useCallback, useState, useEffect } from 'react';

import webportalConfig from '../config/webportal.config';

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
    const alertsUrl = `${webportalConfig.alertManagerUri}/api/v1/alerts?silenced=false`;
    fetch(alertsUrl)
      .then(res => {
        if (!res.ok) {
          throw Error('Failed to get alert infos');
        }
        res
          .json()
          .then(data => {
            if (data.status !== 'success') {
              throw Error('Failed to get alerts data');
            }
            setAlertItems(data.data);
          })
          .catch(() => {
            throw Error('Get alerts json failed');
          });
        // Swallow exceptions here. Since alertManager is optional and we don't have an API to get all avaliable services
      })
      .catch(error => {
        if (error) {
        }
      });
  }, []);

  const open = useCallback(() => {
    setPanelOpened(true);
  }, []);
  const close = useCallback(() => {
    setPanelOpened(false);
  }, [setAlertItems]);

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
    <React.Fragment>
      <i
        className={c('fa fa-bell-o')}
        style={{
          fontSize: '16px',
          cursor: 'pointer',
        }}
        onClick={open}
      />
      <span
        style={{
          height: '10px',
          width: '10px',
          backgroundColor: palette.red,
          borderRadius: '50%',
          display: 'inline-block',
          position: 'relative',
          top: '-8px',
          left: '-7px',
          visibility: alertItems.length > 0 ? 'visible' : 'hidden',
        }}
      />
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
    </React.Fragment>
  );
};
