// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import React, { useState } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { variant } from 'styled-system';
import { Icon } from 'office-ui-fabric-react';
import { Flex, Box, Link } from '../../elements';
import { Parameters } from './parameters';
import { Secrets } from './secrets';
import { EnvVar } from './env-var';
import { Tools } from '../tools/tool-component';
import { ConfigPanel } from './config-panel';
import {
  SIDEBAR_ENVVAR,
  SIDEBAR_PARAM,
  SIDEBAR_SECRET,
  SIDEBAR_TOOL,
} from '../../utils/constants';

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
    borderLeft: '1px solid #f0f0f0',
    overflow: 'hidden',
    transition: 'width 0.2s',
  },
  variant({
    prop: 'expandable',
    variants: {
      true: {
        width: 360,
      },
      false: {
        width: 0,
        height: 0,
      },
    },
  }),
);

const UnwrapperedSidebar = ({
  expandedFlag,
  currentSideList,
  currentSideKey,
  onExpandedFlagChange,
  onSideItemSelect,
}) => {
  const [modalVisible, toggleModalVisible] = useState(false);

  const getCurrentSideComponent = currentKey => {
    switch (currentKey) {
      case SIDEBAR_PARAM:
        return <Parameters />;
      case SIDEBAR_SECRET:
        return <Secrets />;
      case SIDEBAR_ENVVAR:
        return <EnvVar />;
      case SIDEBAR_TOOL:
        return <Tools />;
      default:
        return null;
    }
  };

  return (
    <Flex>
      <SidebarContent expandable={expandedFlag}>
        {getCurrentSideComponent(currentSideKey)}
      </SidebarContent>
      <Flex p='m' flexDirection='column' bg='white'>
        <Link onClick={() => onExpandedFlagChange(!expandedFlag)}>
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
                  onClick={() => onSideItemSelect(item.key)}
                >
                  {item.text}
                </SidebarItem>
              ),
          )}
        </Box>
        <Link onClick={() => toggleModalVisible(true)}>
          <Icon iconName='Settings' />
        </Link>
      </Flex>
      <ConfigPanel
        isOpen={modalVisible}
        onDismiss={() => toggleModalVisible(false)}
      />
    </Flex>
  );
};

const mapStateToProps = state => ({
  expandedFlag: state.SideInfo.expandedFlag,
  currentSideKey: state.SideInfo.currentSideKey,
  currentSideList: state.SideInfo.currentSideList,
});

const mapDispatchToProps = dispatch => ({
  onExpandedFlagChange: flag =>
    dispatch({
      type: 'TOGGLE_EXPANDED_FLAG',
      payload: flag,
    }),
  onSideItemSelect: current =>
    dispatch({
      type: 'TOGGLE_CURRENT_SIDEBAR',
      payload: current,
    }),
});

export const Sidebar = connect(
  mapStateToProps,
  mapDispatchToProps,
)(UnwrapperedSidebar);

UnwrapperedSidebar.propTypes = {
  expandedFlag: PropTypes.bool,
  currentSideList: PropTypes.array,
  currentSideKey: PropTypes.string,
  onExpandedFlagChange: PropTypes.func,
  onSideItemSelect: PropTypes.func,
};
