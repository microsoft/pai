import React, { useState } from 'react';
import { IconButton, Stack, TextField } from 'office-ui-fabric-react';
import { cloneDeep } from 'lodash';
import PropTypes from 'prop-types';

import { STORAGE_PREFIX, ERROR_MARGIN } from '../../utils/constants';
import { InputData } from '../../models/data/input-data';
import { validateMountPath, validateGitUrl } from '../../utils/validation';

export const AddGit = props => {
  const { dataList, setDataList, setDataType } = props;
  const [mountPath, setMountPath] = useState();
  const [gitUrl, setGitUrl] = useState();
  const [containerPathErrorMessage, setContainerPathErrorMessage] = useState(
    'Path should not be empty',
  );
  const [gitAddressErrorMessage, setGitAddressErrorMessage] = useState(
    'Git should not be empty',
  );

  const submitMount = () => {
    const newDataList = cloneDeep(dataList);
    newDataList.push(new InputData(mountPath, gitUrl, 'git'));
    setDataList(newDataList);
    setDataType('none');
  };

  return (
    <Stack horizontal horizontalAlign='space-between' gap='m'>
      <Stack.Item align='baseline'>
        <TextField
          required={true}
          prefix={STORAGE_PREFIX}
          label='Container path'
          errorMessage={containerPathErrorMessage}
          styles={{ root: { width: 200 } }}
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
      </Stack.Item>
      <Stack.Item align='baseline' />
      <TextField
        required={true}
        label='Git repo address'
        errorMessage={gitAddressErrorMessage}
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
          iconProps={{ iconName: 'Accept' }}
          disabled={containerPathErrorMessage || gitAddressErrorMessage}
          styles={{
            root: {
              marginBottom:
                containerPathErrorMessage || gitAddressErrorMessage
                  ? ERROR_MARGIN
                  : 0,
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
          iconProps={{ iconName: 'Cancel' }}
          styles={{
            root: {
              marginBottom:
                containerPathErrorMessage || gitAddressErrorMessage
                  ? ERROR_MARGIN
                  : 0,
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
