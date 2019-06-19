import React, {useState} from 'react';
import c from 'classnames';
import {DefaultButton, Stack, TextField} from 'office-ui-fabric-react';
import {cloneDeep} from 'lodash';
import PropTypes from 'prop-types';

import {InputData} from '../../models/data/input-data';
import t from '../../../../app/components/tachyons.scss';

const STORAGE_PREFIX = '/test';

export const AddGit = (props) => {
  const {dataList, setDataList, setDataType} = props;
  const [mountPath, setMountPath] = useState();
  const [httpUrl, setHttpUrl] = useState();
  const submitMount = () => {
    if (!mountPath) {
      alert('please input the path in container');

      return;
    }
    // const valid = validateMountPath(mountPath);
    // if (!valid.isLegal) {
    //   alert(valid.illegalMessage);

    //   return;
    // }

    if (!httpUrl) {
      alert('please input the git repo address');

      return;
    }
    // const validGit = validateGitUrl(httpUrl);
    // if (!validGit.isLegal) {
    //   alert(validGit.illegalMessage);

    //   return;
    // }
    const newDataList = cloneDeep(dataList);
    newDataList.push(new InputData(mountPath, httpUrl, 'git'));
    setDataList(newDataList);
    setDataType('none');
  };
  return (
    <Stack horizontal>
      <TextField
        required={true} // eslint-disable-line react/jsx-boolean-value
        prefix={STORAGE_PREFIX}
        label='Container Path'
        className={c(t.w30, t.mr3)}
        onChange={(_event, newValue) => {
          setMountPath(`${STORAGE_PREFIX}${newValue}`);
        }}
      />
      <TextField
        required={true} // eslint-disable-line react/jsx-boolean-value
        label='Git repo address'
        className={c(t.w30, t.mr3)}
        onChange={(_event, newValue) => {
          setHttpUrl(newValue);
        }}
      />
      <Stack.Item align='end'>
        <DefaultButton text='add' className={c(t.mr2)} onClick={submitMount} />
      </Stack.Item>
      <Stack.Item align='end'>
        <DefaultButton
          text='cancel'
          onClick={() => {
            setDataType('none');
          }}
        />
      </Stack.Item>
    </Stack>
  );
};

AddGit.propTypes = {
  dataList: PropTypes.arrayOf(PropTypes.instanceOf(InputData)),
  setDataList: PropTypes.func,
  setDataType: PropTypes.func,
};
