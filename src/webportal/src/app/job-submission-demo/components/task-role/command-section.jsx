// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import React from 'react';
import { connect } from 'react-redux';
import { get, isEmpty } from 'lodash';
import { MonacoTextField } from '../controls/monaco-text-field';
import { PAI_ENV_VAR, COMMAND_PLACEHOLDER } from '../../utils/constants';
import PropTypes from 'prop-types';
import { JobProtocol } from '../../models/job-protocol';

const PureCommandSection = ({
  jobProtocol,
  currentTaskRole,
  onJobProtocolChange,
}) => {
  const commands = get(
    jobProtocol,
    `taskRoles[${currentTaskRole}].commands`,
    [],
  );

  const onChange = value => {
    const commands = isEmpty(value) ? [] : value.split('\n');
    onJobProtocolChange(
      new JobProtocol({
        ...jobProtocol,
        taskRoles: {
          ...jobProtocol.taskRoles,
          [currentTaskRole]: {
            ...jobProtocol.taskRoles[currentTaskRole],
            commands,
          },
        },
      }),
    );
  };

  return (
    <MonacoTextField
      monacoProps={{ height: 250, language: 'shell' }}
      value={isEmpty(commands) ? '' : commands.join('\n')}
      placeholder={COMMAND_PLACEHOLDER}
      onChange={onChange}
      completionItems={[...PAI_ENV_VAR.map(x => x.key)]}
      errorMessage={isEmpty(commands) ? 'Commands can not be empty' : null}
    />
  );
};

const mapStateToProps = state => ({
  jobProtocol: state.JobProtocol.jobProtocol,
  currentTaskRole: state.JobExtraInfo.currentTaskRole,
});

const mapDispatchToProps = dispatch => ({
  onJobProtocolChange: jobProtocol =>
    dispatch({ type: 'SAVE_JOBPROTOCOL', payload: jobProtocol }),
});

export const CommandSection = connect(
  mapStateToProps,
  mapDispatchToProps,
)(PureCommandSection);

PureCommandSection.propTypes = {
  jobProtocol: PropTypes.object,
  currentTaskRole: PropTypes.string,
  onJobProtocolChange: PropTypes.func,
};
