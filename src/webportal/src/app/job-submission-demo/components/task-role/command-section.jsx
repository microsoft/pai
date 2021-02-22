// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import React from 'react';
import { connect } from 'react-redux';
import { get, isEmpty, isNil } from 'lodash';
import { MonacoTextField } from '../controls/monaco-text-field';
import { PAI_ENV_VAR, COMMAND_PLACEHOLDER } from '../../utils/constants';
import PropTypes from 'prop-types';

const PureCommandSection = ({ dispatch, jobProtocol, currentTaskRole }) => {
  const commands = get(
    jobProtocol,
    `taskRoles[${currentTaskRole}].commands`,
    null,
  );

  const onChange = value => {
    const commands = isEmpty(value)
      ? []
      : value
          .trim()
          .split('\n')
          .map(line => line.trim());
    dispatch({
      type: 'SAVE_JOBPROTOCOL',
      payload: {
        ...jobProtocol,
        taskRoles: {
          ...jobProtocol.taskRoles,
          [currentTaskRole]: {
            ...jobProtocol.taskRoles[currentTaskRole],
            commands,
          },
        },
      },
    });
  };

  return (
    <MonacoTextField
      monacoProps={{ height: 250, language: 'shell' }}
      value={isNil(commands) ? '' : commands.join('\n')}
      placeholder={COMMAND_PLACEHOLDER}
      onChange={onChange}
      completionItems={[...PAI_ENV_VAR.map(x => x.key)]}
      errorMessage={isEmpty(commands) ? 'Commands can not be empty' : null}
    />
  );
};

export const CommandSection = connect(({ jobInformation }) => ({
  jobProtocol: jobInformation.jobProtocol,
  currentTaskRole: jobInformation.currentTaskRole,
}))(PureCommandSection);

PureCommandSection.propTypes = {
  dispatch: PropTypes.func,
  jobProtocol: PropTypes.object,
  currentTaskRole: PropTypes.string,
};
