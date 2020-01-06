import React, { useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { cloneDeep, isNil, get } from 'lodash';
import { Hint } from '../sidebar/hint';
import { TooltipIcon } from '../controls/tooltip-icon';
import { TENSORBOARD_LOG_PATH, PAI_PLUGIN } from '../../utils/constants';
import {
  FontWeights,
  Toggle,
  Stack,
  Text,
  FontSizes,
} from 'office-ui-fabric-react';

const style = {
  headerText: {
    root: {
      fontSize: FontSizes.large,
      fontWeight: FontWeights.semibold,
    },
  },
};

const generateDefaultTensorBoardExtras = port => {
  const tensorBoardExtras = {
    plugin: 'tensorboard',
    parameters: {
      port: port,
      logdir: {
        path: TENSORBOARD_LOG_PATH,
      },
    },
  };
  return tensorBoardExtras;
};

export const TensorBoard = props => {
  const { extras, onChange } = props;

  // TensorBoard will use random port in [10000, 10100)
  const tensorBoardPort = useMemo(
    () => Math.floor(Math.random() * 100 + 10000),
    [],
  );

  const onTensorBoardChange = useCallback(
    (_, isChecked) => {
      let updatedExtras = cloneDeep(extras);
      if (isNil(updatedExtras)) {
        updatedExtras = {};
      }
      let plugins = get(updatedExtras, [PAI_PLUGIN], []);

      if (isChecked) {
        const tensorBoard = generateDefaultTensorBoardExtras(tensorBoardPort);
        plugins.push(tensorBoard);
      } else {
        plugins = plugins.filter(plugin => plugin.plugin !== 'tensorboard');
      }
      updatedExtras[PAI_PLUGIN] = plugins;
      onChange(updatedExtras);
    },
    [onChange, extras, tensorBoardPort],
  );

  return (
    <Stack gap='m' styles={{ root: { height: '100%' } }}>
      <Stack horizontal gap='s1'>
        <Text styles={style.headerText}>TensorBoard</Text>
        <TooltipIcon
          content={`You should save logs under ${TENSORBOARD_LOG_PATH} in the training script.
          TensorBoard can only read logs from the first task role if ${TENSORBOARD_LOG_PATH} is not mounted in Data section.`}
        />
      </Stack>
      <Hint>
        By default, tensorBoard will read logs under{' '}
        <code>{TENSORBOARD_LOG_PATH}</code> and use random port in{' '}
        <code>[10000, 10100)</code>.
      </Hint>
      <Toggle
        label='Enable TensorBoard'
        inlineLabel={true}
        checked={
          !isNil(
            get(extras, [PAI_PLUGIN], []).find(
              plugin => plugin.plugin === 'tensorboard',
            ),
          )
        }
        onChange={onTensorBoardChange}
      />
    </Stack>
  );
};

TensorBoard.propTypes = {
  extras: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
};
