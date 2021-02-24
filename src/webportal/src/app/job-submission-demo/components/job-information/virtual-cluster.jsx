// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import { Dropdown } from 'office-ui-fabric-react';
import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { get } from 'lodash';
import PropTypes from 'prop-types';

const PureVirtualCluster = ({
  dispatch,
  jobProtocol,
  availableVirtualClusters,
}) => {
  const virtualCluster = get(jobProtocol, 'defaults.virtualCluster', 'default');

  const options = availableVirtualClusters.map((vcName, index) => ({
    key: `vc_${index}`,
    text: vcName,
  }));
  const vcIndex = options.findIndex(val => val.text === virtualCluster);

  const onChange = (_, item) => {
    dispatch({
      type: 'SAVE_JOBPROTOCOL',
      payload: {
        ...jobProtocol,
        defaults: { ...jobProtocol.defaults, virtualCluster: item.text },
      },
    });
  };

  useEffect(() => {
    dispatch({
      type: 'fetchHivedSkuTypes',
      payload: { virtualCluster },
    });
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

export const VirtualCluster = connect(({ jobInformation }) => ({
  jobProtocol: jobInformation.jobProtocol,
  availableVirtualClusters: jobInformation.availableVirtualClusters,
}))(PureVirtualCluster);

PureVirtualCluster.propTypes = {
  dispatch: PropTypes.func,
  jobProtocol: PropTypes.object,
  availableVirtualClusters: PropTypes.array,
};
