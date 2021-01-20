import React, { useState } from 'react';
import styled from 'styled-components';
import { Flex, Box, Link } from '../../elements';
import { connect } from 'react-redux';
import { variant } from 'styled-system';
import { ConfigPanel } from './config-panel';
import { Icon } from 'office-ui-fabric-react';
import { SIDEBAR_ENVVAR, SIDEBAR_PARAM } from '../../utils/constants';
import { Parameters } from './parameters';
import { EnvVar } from './env-var';

const SidebarItem = styled(Box)(
  {
    writingMode: 'vertical-rl',
    cursor: 'pointer',
  },
  variant({
    prop: 'selected',
    variants: {
      true: {
        color: 'black',
        fontWeight: 'bold',
      },
      false: {
        color: 'black-30',
      },
    },
  }),
);

const SidebarContent = styled(Box)(
  {
    background: '#fff',
    overflow: 'hidden',
    transition: 'width 0.2s',
  },
  variant({
    prop: 'expandable',
    variants: {
      true: {
        // width: 480,
        padding: 'm',
      },
      false: {
        width: 0,
      },
    },
  }),
);

const UnwrapperedSidebar = ({ dispatch, currentSideList, currentSideKey }) => {
  const [expandedFlag, setExpandedFlag] = useState(false);
  const [isModalOpen, toggleModalOpen] = useState(false);

  const getCurrentSideComponent = currentKey => {
    switch (currentKey) {
      case SIDEBAR_PARAM:
        return <Parameters />;
      case SIDEBAR_ENVVAR:
        return <EnvVar />;
      default:
        return null;
    }
  };

  const toggleExpandedKey = () => setExpandedFlag(!expandedFlag);

  const onSidebarSelect = key => {
    dispatch({
      type: 'TOGGLE_CURRENT_SIDEBAR',
      payload: key,
    });
  };

  return (
    <Flex>
      <SidebarContent expandable={expandedFlag}>
        {getCurrentSideComponent(currentSideKey)}
      </SidebarContent>
      <Flex p='m' flexDirection='column' bg='white'>
        <Link onClick={toggleExpandedKey}>
          <Icon iconName={expandedFlag ? 'ChevronLeft' : 'ChevronRight'} />
        </Link>
        <Box flex={1}>
          {currentSideList.map(
            item =>
              item.checked && (
                <SidebarItem
                  mt='m'
                  mb='m'
                  selected={currentSideKey === item.key}
                  onClick={onSidebarSelect.bind(this, item.key)}
                >
                  {item.text}
                </SidebarItem>
              ),
          )}
        </Box>
        <Link onClick={() => toggleModalOpen(true)}>
          <Icon iconName='Settings' />
        </Link>
      </Flex>
      <ConfigPanel
        isOpen={isModalOpen}
        onDismiss={() => toggleModalOpen(false)}
      />
    </Flex>
  );
};

export const Sidebar = connect(({ global }) => ({
  currentSideList: global.currentSideList,
  currentSideKey: global.currentSideKey,
}))(UnwrapperedSidebar);
