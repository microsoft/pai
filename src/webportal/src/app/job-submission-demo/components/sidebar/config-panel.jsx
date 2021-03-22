// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import React, { useState } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Modal, Toggle } from 'office-ui-fabric-react';
import { Flex, Box, Button, Heading } from '../../elements';
import { SIDEBAR_CONFIG } from '../../utils/constants';

const PureConfigPanel = ({
  currentSideList,
  onSideConfigChange,
  isOpen,
  onDismiss,
}) => {
  console.log(currentSideList);
  const [sideList, handleSideList] = useState(currentSideList);

  const onToggleChange = (item, checked) => {
    handleSideList(
      sideList.map(side => ({
        ...side,
        ...(side.key === item.key ? { checked } : null),
      })),
    );
  };

  const onSubmit = () => {
    onSideConfigChange(sideList);
    onDismiss();
  };

  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss}>
      <Box pl='l1' pr='l1'>
        <Heading>Panel Setting</Heading>
        <Flex flexDirection='column'>
          {SIDEBAR_CONFIG.map((item, index) => (
            <Flex key={index}>
              <Box flex={1} width={240}>
                {item.text}
              </Box>
              <Toggle
                checked={sideList[index].checked}
                onChange={(_, checked) => onToggleChange(item, checked)}
              />
            </Flex>
          ))}
        </Flex>
        <Flex mt='m' mb='m' justifyContent='flex-end'>
          <Button mr='s1' onClick={onSubmit}>
            Save
          </Button>
          <Button onClick={onDismiss}>Cancel</Button>
        </Flex>
      </Box>
    </Modal>
  );
};

const mapStateToProps = state => ({
  currentSideList: state.SideInfo.currentSideList,
});

const mapDispatchToProps = dispatch => ({
  onSideConfigChange: config => {
    dispatch({
      type: 'UPDATE_SIDEBAR_CONFIG',
      payload: config,
    });
  },
});

export const ConfigPanel = connect(
  mapStateToProps,
  mapDispatchToProps,
)(PureConfigPanel);

PureConfigPanel.propTypes = {
  currentSideList: PropTypes.array,
  onSideConfigChange: PropTypes.func,
  isOpen: PropTypes.bool.isRequired,
  onDismiss: PropTypes.func.isRequired,
};
