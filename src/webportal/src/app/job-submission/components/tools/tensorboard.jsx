import React from 'react';
import PropTypes from 'prop-types';
import { cloneDeep, isNil } from 'lodash';
import { Hint } from '../sidebar/hint';
import { ErrMsg } from '../sidebar/errormessage';
import { generateDefaultTensorBoardExtras } from '../../utils/utils';
import { TooltipIcon } from '../controls/tooltip-icon';
import { TENSORBOARD_LOG_PATH } from '../../utils/constants';
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

export const TensorBoard = props => {
  const { jobData, taskRoles, extras, onChange } = props;

  const detectMountPathAndMultipleTaskRoles = () => {
    if (!extras.tensorBoard) {
      return false;
    }
    if (taskRoles.length <= 1) {
      return false;
    }
    const teamDataList = jobData.mountDirs;
    if (isNil(teamDataList)) {
      return true;
    }
    for (const teamData of teamDataList.getTeamDataList()) {
      if (teamData.mountPath === TENSORBOARD_LOG_PATH) {
        return false;
      }
    }
    return true;
  };

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
        Users should save logs under <code>{`${TENSORBOARD_LOG_PATH}`}</code>.
      </Hint>
      <Toggle
        label='Enable TensorBoard'
        inlineLabel={true}
        checked={!isNil(extras.tensorBoard)}
        onChange={(ev, isChecked) => {
          const updatedExtras = cloneDeep(extras);
          if (isChecked) {
            updatedExtras.tensorBoard = generateDefaultTensorBoardExtras();
          } else {
            delete updatedExtras.tensorBoard;
          }
          onChange(updatedExtras);
        }}
      />
      {detectMountPathAndMultipleTaskRoles() && (
        <ErrMsg>
          <div>
            Multiple task roles were detected but not mounted{' '}
            <code>{TENSORBOARD_LOG_PATH}</code> in Data section.
          </div>
          <div>TensorBoard can only read logs from the first task role.</div>
        </ErrMsg>
      )}
    </Stack>
  );
};

TensorBoard.propTypes = {
  jobData: PropTypes.object.isRequired,
  taskRoles: PropTypes.array.isRequired,
  extras: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
};
