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
  } = props;

  const defaultLogPath = '/mnt/tensorboard';

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
        <TooltipHost tooltipProps={{
          onRenderContent: () => {
            return (
              <Hint>
                You could save your logs under <code>{`${defaultLogPath}/$PAI_JOB_NAME`}</code> in the training script.
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
          disabled={!canEnableTensorBoard()}
        />
        {!canEnableTensorBoard() && (
          <ErrMsg>
            Please mount <code>{defaultLogPath}</code> in Data section.
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
};
