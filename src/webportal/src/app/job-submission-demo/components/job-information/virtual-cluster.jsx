// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import { Dropdown } from 'office-ui-fabric-react';
import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { get } from 'lodash';
import PropTypes from 'prop-types';
import { JobProtocol } from '../../models/job-protocol';

const PureVirtualCluster = ({
  jobProtocol,
  availableVirtualClusters,
  onJobProtocolChange,
  fetchHivedSkuTypes,
}) => {
  const virtualCluster = get(jobProtocol, 'defaults.virtualCluster', 'default');

  const options = availableVirtualClusters.map((vcName, index) => ({
    key: `vc_${index}`,
    text: vcName,
  }));
  const vcIndex = options.findIndex(val => val.text === virtualCluster);

  const onChange = (_, item) => {
    onJobProtocolChange(
      new JobProtocol({
        ...jobProtocol,
        defaults: { ...jobProtocol.defaults, virtualCluster: item.text },
      }),
    );
  };

  useEffect(() => {
    fetchHivedSkuTypes(virtualCluster);
  }, [virtualCluster]);

  return (
    <Dropdown
      placeholder='Select an option'
      options={options}
      onChange={onChange}
      selectedKey={vcIndex === -1 ? null : `vc_${vcIndex}`}
    />
  );
};

const mapStateToProps = state => ({
  jobProtocol: state.JobProtocol.jobProtocol,
  availableVirtualClusters: state.JobExtraInfo.availableVirtualClusters,
});

const mapDispatchToProps = dispatch => ({
  onJobProtocolChange: jobProtocol =>
    dispatch({ type: 'SAVE_JOBPROTOCOL', payload: jobProtocol }),
  fetchHivedSkuTypes: virtualCluster =>
    dispatch({ type: 'fetchHivedSkuTypes', payload: { virtualCluster } }),
});

export const VirtualCluster = connect(
  mapStateToProps,
  mapDispatchToProps,
)(PureVirtualCluster);

PureVirtualCluster.propTypes = {
  jobProtocol: PropTypes.object,
  availableVirtualClusters: PropTypes.array,
  onJobProtocolChange: PropTypes.func,
  fetchHivedSkuTypes: PropTypes.func,
};
