import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { debounce } from 'lodash';
import { TextField } from 'office-ui-fabric-react';

const loginUser = cookies.get('user');

function getChecksum(str) {
  let res = 0;
  for (const c of str) {
    res ^= c.charCodeAt(0) & 0xff;
  }
  return res.toString(16);
}

const PureJobName = ({ dispatch, jobProtocol }) => {
  const { name } = jobProtocol;

  useEffect(() => {
    let suffix = Date.now().toString(16);
    suffix = suffix.substring(suffix.length - 6);
    let name = `${loginUser}_${suffix}`;
    name = name + getChecksum(name);
    dispatch({ type: 'SAVE_JOBPROTOCOL', payload: { ...jobProtocol, name } });
  }, []);

  const onChange = (_, val) => {
    dispatch({
      type: 'SAVE_JOBPROTOCOL',
      payload: { ...jobProtocol, name: val },
    });
  };

  return <TextField value={name} onChange={debounce(onChange, 200)} />;
};

export const JobName = connect(({ jobInformation }) => ({
  jobProtocol: jobInformation.jobProtocol,
}))(PureJobName);
