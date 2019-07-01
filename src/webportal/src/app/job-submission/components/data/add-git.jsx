import React, {useState} from 'react';
import {IconButton, Stack, TextField} from 'office-ui-fabric-react';
import {cloneDeep} from 'lodash';
import PropTypes from 'prop-types';

import {STORAGE_PREFIX} from '../../utils/constants';
import {InputData} from '../../models/data/input-data';
import {validateMountPath, validateGitUrl} from '../../utils/validation';

export const AddGit = (props) => {
  const {dataList, setDataList, setDataType} = props;
  const [mountPath, setMountPath] = useState();
  const [gitUrl, setGitUrl] = useState();
  const [containerPathErrorMessage, setContainerPathErrorMessage] = useState('Path should not be empty');
  const [gitAddressErrorMessage, setGitAddressErrorMessage] = useState('Git should not be empty');

  const submitMount = () => {
    const newDataList = cloneDeep(dataList);
    newDataList.push(new InputData(mountPath, gitUrl, 'git'));
    setDataList(newDataList);
    setDataType('none');
  };

  return (
    <Stack horizontal horizontalAlign='space-between'>
      <TextField
        required={true}
        prefix={STORAGE_PREFIX}
        label='Container Path'
        errorMessage={containerPathErrorMessage}
        styles={{
          root: {
            width: 200,
            marginBottom: gitAddressErrorMessage
              ? containerPathErrorMessage
                ? 0
                : 22.15
              : 0,
          },
        }}
        onChange={(_event, newValue) => {
          const valid = validateMountPath(`/${newValue}`);
          if (!valid.isLegal) {
            setContainerPathErrorMessage(valid.illegalMessage);
          } else {
            setContainerPathErrorMessage(null);
            setMountPath(`${STORAGE_PREFIX}${newValue}`);
          }
        }}
      />
      <TextField
        required={true} // eslint-disable-line react/jsx-boolean-value
        label='Git repo address'
        errorMessage={gitAddressErrorMessage}
        styles={{
          root: {
            width: 230,
            marginBottom: containerPathErrorMessage
              ? gitAddressErrorMessage
                ? 0
                : 22.15
              : 0,
          },
        }}
        onChange={(_event, newValue) => {
          const valid = validateGitUrl(newValue);
          if (!valid.isLegal) {
            setGitAddressErrorMessage(valid.illegalMessage);
          } else {
            setGitAddressErrorMessage(null);
            setGitUrl(newValue);
          }
        }}
      />
      <Stack.Item align='end'>
        <IconButton
          iconProps={{iconName: 'Accept'}}
          disabled={containerPathErrorMessage || gitAddressErrorMessage}
          styles={{
            root: {
              marginBottom: (containerPathErrorMessage || gitAddressErrorMessage) ? 22.15 : 0,
            },
            rootDisabled: {
              backgroundColor: 'transparent',
            },
          }}
          onClick={submitMount}
        />
      </Stack.Item>
      <Stack.Item align='end'>
        <IconButton
          iconProps={{iconName: 'Cancel'}}
          styles={{
            root: {
              marginBottom: (containerPathErrorMessage || gitAddressErrorMessage) ? 22.15 : 0,
            },
          }}
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
