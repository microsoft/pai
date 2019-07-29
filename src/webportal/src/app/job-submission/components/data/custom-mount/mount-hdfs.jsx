import React, {useState} from 'react';
import {IconButton, Stack, TextField} from 'office-ui-fabric-react';
import {cloneDeep} from 'lodash';
import PropTypes from 'prop-types';

import {MOUNT_PREFIX, ERROR_MARGIN} from '../../../utils/constants';
import {validateMountPath, validateHDFSUrl} from '../../../utils/validation';
import {InputData} from '../../../models/data/input-data';

export const MountHDFS = (props) => {
  const {mountList, setMountList, setMountType} = props;
  const [mountPath, setMountPath] = useState();
  const [hDFSUrl, setHDFSUrl] = useState();
  const [containerPathErrorMessage, setContainerPathErrorMessage] = useState(
    'Path should not be empty',
  );
  const [hDFSUrlErrorMessage, setHDFSUrlErrorMessage] = useState(
    'HDFS url should not be empty',
  );

  const submitMount = () => {
    const newMountList = cloneDeep(mountList);
    newMountList.push(new InputData(mountPath, `hdfs://${hDFSUrl}`, 'hdfsmount'));
    setMountList(newMountList);
    setMountType('none');
  };

  return (
    <Stack horizontal horizontalAlign='space-between' gap='m'>
      <Stack.Item align='baseline'>
        <TextField
          required
          prefix={MOUNT_PREFIX}
          label='Container path'
          errorMessage={containerPathErrorMessage}
          styles={{root: {width: 200}}}
          onChange={(_event, newValue) => {
            const valid = validateMountPath(`/${newValue}`);
            if (!valid.isLegal) {
              setContainerPathErrorMessage(valid.illegalMessage);
            } else {
              setContainerPathErrorMessage(null);
              setMountPath(`${MOUNT_PREFIX}${newValue}`);
            }
          }}
        />
      </Stack.Item>
      <Stack.Item align='baseline'>
        <TextField
          required
          prefix='hdfs://'
          label='IP:Port/RemotePath'
          errorMessage={hDFSUrlErrorMessage}
          onChange={(_event, newValue) => {
            const valid = validateHDFSUrl(`${newValue}`);
            if (!newValue) {
              setHDFSUrlErrorMessage('HDFS url should not be empty');
            } else {
              if (!valid.isLegal) {
                setHDFSUrlErrorMessage(valid.illegalMessage);
              } else {
                setHDFSUrlErrorMessage(null);
                setHDFSUrl(newValue);
              }
            }
          }}
        />
      </Stack.Item>
      <Stack.Item align='end'>
        <IconButton
          iconProps={{iconName: 'Accept'}}
          onClick={submitMount}
          disabled={hDFSUrlErrorMessage || containerPathErrorMessage}
          styles={{
            root: {
              marginBottom:
                hDFSUrlErrorMessage || containerPathErrorMessage
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
          iconProps={{iconName: 'Cancel'}}
          onClick={() => {
            setMountType('none');
          }}
          styles={{
            root: {
              marginBottom:
                hDFSUrlErrorMessage || containerPathErrorMessage
                  ? ERROR_MARGIN
                  : 0,
            },
          }}
        />
      </Stack.Item>
    </Stack>
  );
};

MountHDFS.propTypes = {
  mountList: PropTypes.arrayOf(PropTypes.instanceOf(InputData)),
  setMountList: PropTypes.func,
  setMountType: PropTypes.func,
};
