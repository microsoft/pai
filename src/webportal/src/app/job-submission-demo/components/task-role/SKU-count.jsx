// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import React from 'react';
import { connect } from 'react-redux';
import { debounce, get } from 'lodash';
import { SpinButton } from 'office-ui-fabric-react';
import PropTypes from 'prop-types';
import { JobProtocol } from '../../models/job-protocol';
import { FormSpinButton } from '../controls/form-spin-button';

const SKU_COUNT_MIN = 0;

const PureSKUCount = ({
  jobProtocol,
  currentTaskRole,
  onJobProtocolChange,
}) => {
  const skuNum = get(
    jobProtocol,
    `extras.hivedScheduler.taskRoles[${currentTaskRole}].skuNum`,
    0,
  );

  const onChange = value => {
    onJobProtocolChange(
      new JobProtocol({
        ...jobProtocol,
        extras: {
          ...jobProtocol.extras,
          hivedScheduler: {
            ...jobProtocol.extras.hivedScheduler,
            taskRoles: {
              ...jobProtocol.extras.hivedScheduler.taskRoles,
              [currentTaskRole]: {
                ...jobProtocol.extras.hivedScheduler.taskRoles[currentTaskRole],
                skuNum: value,
              },
            },
          },
        },
      }),
    );
  };

  return (
    <FormSpinButton
      min={SKU_COUNT_MIN}
      step={1}
      value={skuNum}
      onChange={onChange}
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

export const SKUCount = connect(
  mapStateToProps,
  mapDispatchToProps,
)(PureSKUCount);

PureSKUCount.propTypes = {
  jobProtocol: PropTypes.object,
  currentTaskRole: PropTypes.string,
  onJobProtocolChange: PropTypes.func,
};
