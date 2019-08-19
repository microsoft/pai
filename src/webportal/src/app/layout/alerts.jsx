import c from 'classnames';
import {Panel, List, mergeStyleSets, getFocusStyle, getTheme, initializeIcons, PanelType} from 'office-ui-fabric-react';
import React, {useCallback, useState, useEffect} from 'react';

import {initTheme} from '../components/theme';

import config from '../config/webportal.config';

initTheme();
initializeIcons();

const theme = getTheme();
const {palette, semanticColors} = theme;

const classNames = mergeStyleSets({
  itemCell: [
    getFocusStyle(theme, {inset: -1}),
    {
      minHeight: 54,
      padding: 10,
      boxSizing: 'border-box',
      borderBottom: `1px solid ${semanticColors.bodyDivider}`,
      display: 'flex',
      selectors: {
        '&:hover': {background: palette.neutralLight},
      },
    },
  ],
});

export const NotificationButton = () => {
  const [panelOpened, setPanelOpened] = useState(false);
  const [alertItems, setAlertItems] = useState([]);

  useEffect(() => {
    const alertsUrl = `${config.alertManagerUri}/api/v1/alerts?silenced=false&inhibited=false`;
    fetch(alertsUrl).then((res) => {
      if (!res.ok) {
        throw Error('Failed to get alert infos');
      }
      res.json().then((data) => {
        if (data.status !== 'success') {
          throw Error('Failed to get alerts data');
        }
        setAlertItems(data.data);
      }).catch(() => {
        throw Error('Get alerts json failed');
      });
    }).catch(alert);
  }, []);

  const open = useCallback(() => {
    setPanelOpened(true);
  });
  const close = useCallback(() => {
    setPanelOpened(false);
  }, [setAlertItems]);

  return (
    <React.Fragment>
      <i className={c('fa fa-bell-o')} style={{fontSize: '16px'}} onClick={open}></i>
      <Panel
        isOpen={panelOpened}
        isLightDismiss={true}
        onDismiss={close}
        type={PanelType.medium}
        headerText={'Alerts'}>
        <List items={alertItems} onRenderCell={(item) => {
          return (
             <div className={classNames.itemCell} data-is-focusable={true}>
               {item.annotations.summary}
            </div>
          );
        }}/>
      </Panel>
    </React.Fragment>
  );
};
