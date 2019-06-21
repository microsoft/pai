import React, {useState} from 'react';
import c from 'classnames';
import {IconButton, Stack, TextField} from 'office-ui-fabric-react';
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
    <Stack horizontal horizontalAlign='space-between'>
      <TextField
        required={true} // eslint-disable-line react/jsx-boolean-value
        prefix={STORAGE_PREFIX}
        label='Container Path'
        onChange={(_event, newValue) => {
          setMountPath(`${STORAGE_PREFIX}${newValue}`);
        }}
        styles={{root: {minWidth: 200}}}
      />
      <TextField
        required={true} // eslint-disable-line react/jsx-boolean-value
        label='Git repo address'
        onChange={(_event, newValue) => {
          setHttpUrl(newValue);
        }}
        styles={{root: {minWidth: 230}}}
      />
      <Stack.Item align='end'>
        <IconButton iconProps={{iconName: 'Accept'}} onClick={submitMount} />
      </Stack.Item>
      <Stack.Item align='end'>
        <IconButton
          iconProps={{iconName: 'Cancel'}}
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
