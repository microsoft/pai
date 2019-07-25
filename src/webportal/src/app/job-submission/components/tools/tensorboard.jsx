import React from 'react';
import c from 'classnames';
import PropTypes from 'prop-types';
import {Hint} from '../sidebar/hint';
import {JobTaskRole} from '../../models/job-task-role';

import {Stack, Checkbox, FontClassNames, FontWeights, getTheme} from 'office-ui-fabric-react';

const {spacing} = getTheme();
export const TensorBoard = (props) => {
  const {
    tensorBoardFlag,
    setTensorBoardFlag,
    jobData,
  } = props;

  const defaultLogPath = '/mnt/data2';

  const canEnableTensorBoard = () => {
    const teamDataList = jobData.mountDirs.getTeamDataList();
    for (const teamData of teamDataList) {
      if (teamData.mountPath === defaultLogPath) {
        return true;
      }
    }
    return false;
  };

  return (
    <div>
      <div
        className={c(FontClassNames.mediumPlus)}
        style={{fontWeight: FontWeights.semibold, paddingBottom: spacing.m}}
      >
        TensorBoard
      </div>
      <Stack gap='m'>
        <Hint>
          You could save your logs under <code>{`${defaultLogPath}/$PAI_JOB_NAME`}</code> in the training script.
        </Hint>
        <Checkbox
          key='TensorBoard'
          label='Enable TensorBoard'
          checked={tensorBoardFlag}
          onChange={(ev, isChecked) => {
            setTensorBoardFlag(isChecked && canEnableTensorBoard());
          }}
          disabled={!canEnableTensorBoard()}
        />
      </Stack>
    </div>
  );
};

TensorBoard.propTypes = {
  tensorBoardFlag: PropTypes.bool,
  setTensorBoardFlag: PropTypes.func,
  taskRoles: PropTypes.arrayOf(PropTypes.instanceOf(JobTaskRole)).isRequired,
  setTaskRoles: PropTypes.func,
  jobData: PropTypes.object.isRequired,
  tensorBoardExtras: PropTypes.object,
  setTensorBoardExtras: PropTypes.func,
};
