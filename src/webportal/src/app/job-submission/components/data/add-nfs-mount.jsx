import React, {useState} from 'react';
import {IconButton, Stack, TextField} from 'office-ui-fabric-react';
import {cloneDeep} from 'lodash';
import PropTypes from 'prop-types';

import {MOUNT_PREFIX, ERROR_MARGIN} from '../../utils/constants';
import {validateMountPath, validateNFSUrl} from '../../utils/validation';
import {InputData} from '../../models/data/input-data';

export const AddNFSMount = (props) => {
  const {mountList, setMountList, setMountType} = props;
  const [mountPath, setMountPath] = useState();
  const [nFSUrl, setNFSUrl] = useState();
  const [containerPathErrorMessage, setContainerPathErrorMessage] = useState(
    'Path should not be empty',
  );
  const [nFSUrlErrorMessage, setNFSUrlErrorMessage] = useState(
    'NFS url should not be empty',
  );

  const submitMount = () => {
    const newMountList = cloneDeep(mountList);
    newMountList.push(new InputData(mountPath, `nfs://${nFSUrl}`, 'nfsmount'));
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
          prefix='nfs://'
          required
          label='IP/RemotePath'
          errorMessage={nFSUrlErrorMessage}
          onChange={(_event, newValue) => {
            const valid = validateNFSUrl(`${newValue}`);
            if (!newValue) {
              setNFSUrlErrorMessage('NFS url should not be empty');
            } else {
              if (!valid.isLegal) {
                setNFSUrlErrorMessage(valid.illegalMessage);
              } else {
                setNFSUrlErrorMessage(null);
                setNFSUrl(newValue);
              }
            }
          }}
        />
      </Stack.Item>
      <Stack.Item align='end'>
        <IconButton
          iconProps={{iconName: 'Accept'}}
          onClick={submitMount}
          disabled={nFSUrlErrorMessage || containerPathErrorMessage}
          styles={{
            root: {
              marginBottom:
                nFSUrlErrorMessage || containerPathErrorMessage
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
                nFSUrlErrorMessage || containerPathErrorMessage
                  ? ERROR_MARGIN
                  : 0,
            },
          }}
        />
      </Stack.Item>
    </Stack>
  );
};
AddNFSMount.propTypes = {
  mountList: PropTypes.arrayOf(PropTypes.instanceOf(InputData)),
  setMountList: PropTypes.func,
  setMountType: PropTypes.func,
};
