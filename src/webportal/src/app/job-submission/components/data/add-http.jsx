import React, { useState } from 'react';
import { IconButton, Stack, TextField } from 'office-ui-fabric-react';
import { cloneDeep } from 'lodash';
import PropTypes from 'prop-types';

import { STORAGE_PREFIX, ERROR_MARGIN } from '../../utils/constants';
import { validateMountPath } from '../../utils/validation';
import { InputData } from '../../models/data/input-data';

export const AddHttp = props => {
  const { dataList, setDataList, setDataType } = props;
  const [mountPath, setMountPath] = useState();
  const [httpUrl, setHttpUrl] = useState();
  const [containerPathErrorMessage, setContainerPathErrorMessage] = useState(
    'Path should not be empty',
  );
  const [httpAddressErrorMessage, setHttpAddressErrorMessage] = useState(
    'Http address should not be empty',
  );

  const submitMount = () => {
    const newMountList = cloneDeep(dataList);
    newMountList.push(new InputData(mountPath, httpUrl, 'http'));
    setDataList(newMountList);
    setDataType('none');
  };

  return (
    <Stack horizontal horizontalAlign='space-between' gap='m'>
      <Stack.Item align='baseline'>
        <TextField
          required
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
      <Stack.Item align='baseline'>
        <TextField
          required
          label='Http address'
          errorMessage={httpAddressErrorMessage}
          onChange={(_event, newValue) => {
            if (!newValue) {
              setHttpAddressErrorMessage('Http address should not be empty');
            } else {
              setHttpAddressErrorMessage(null);
              setHttpUrl(newValue);
            }
          }}
        />
      </Stack.Item>
      <Stack.Item align='end'>
        <IconButton
          iconProps={{ iconName: 'Accept' }}
          onClick={submitMount}
          disabled={httpAddressErrorMessage || containerPathErrorMessage}
          styles={{
            root: {
              marginBottom:
                httpAddressErrorMessage || containerPathErrorMessage
                  ? ERROR_MARGIN
                  : 0,
            },
            rootDisabled: {
              backgroundColor: 'transparent',
            },
          }}
        />
      </Stack.Item>
      <Stack.Item align='end'>
        <IconButton
          iconProps={{ iconName: 'Cancel' }}
          onClick={() => {
            setDataType('none');
          }}
          styles={{
            root: {
              marginBottom:
                httpAddressErrorMessage || containerPathErrorMessage
                  ? ERROR_MARGIN
                  : 0,
            },
          }}
        />
      </Stack.Item>
    </Stack>
  );
};

AddHttp.propTypes = {
  dataList: PropTypes.arrayOf(PropTypes.instanceOf(InputData)),
  setDataList: PropTypes.func,
  setDataType: PropTypes.func,
};
