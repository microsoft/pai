import React from 'react';
import c from 'classnames';
import PropTypes from 'prop-types';
import {Hint} from '../sidebar/hint';
import {ErrMsg} from '../sidebar/errormessage';

import {
  FontClassNames,
  FontWeights,
  getTheme,
  Toggle,
  TooltipHost,
  Icon,
} from 'office-ui-fabric-react';

const {spacing} = getTheme();

export const TensorBoard = (props) => {
  const {
    tensorBoardFlag,
    setTensorBoardFlag,
    jobData,
    taskRoles,
  } = props;

  const defaultLogPath = '/mnt/tensorboard';

  const detectMountPathAndMultipleTaskRoles = () => {
    if (!tensorBoardFlag) {
      return false;
    }
    const teamDataList = jobData.mountDirs.getTeamDataList();
    for (const teamData of teamDataList) {
      if (teamData.mountPath === defaultLogPath) {
        return false;
      }
    }
    if (taskRoles.length <= 1) {
      return false;
    }
    return true;
  };

  return (
    <div>
      <div
        className={c(FontClassNames.mediumPlus)}
        style={{fontWeight: FontWeights.semibold, paddingBottom: spacing.m}}
      >
        <TooltipHost tooltipProps={{
          onRenderContent: () => {
            return (
              <Hint>
                You could save logs under <code>{`${defaultLogPath}/$PAI_JOB_NAME`}</code> in the training script.
                TensorBoard can only read logs from the first task role if <code>{`${defaultLogPath}`}</code> is not mounted.
              </Hint>
            );
          },
        }}
        >
          TensorBoard
          <Icon iconName="Info" />
        </TooltipHost>
      </div>
      <div>
        <Toggle
          label='Enable TensorBoard'
          inlineLabel={true}
          checked={tensorBoardFlag}
          onChange={(ev, isChecked) => {
            setTensorBoardFlag(isChecked);
          }}
        />
        {detectMountPathAndMultipleTaskRoles() && (
          <ErrMsg>
            <div>
              Multiple task roles were detected but not mounted <code>{defaultLogPath}</code>.
            </div>
            <div>
              TensorBoard can only read logs from the first task role.
            </div>
        </ErrMsg>
        )}
      </div>
    </div>
  );
};

TensorBoard.propTypes = {
  tensorBoardFlag: PropTypes.bool,
  setTensorBoardFlag: PropTypes.func,
  jobData: PropTypes.object.isRequired,
  taskRoles: PropTypes.array.isRequired,
};
