import React, { useState, useEffect } from 'react';
import { cloneDeep, isNil } from 'lodash';
import {
  TextField,
  FontClassNames,
  Stack,
  IconButton,
  Label,
} from 'office-ui-fabric-react';
import PropTypes from 'prop-types';

import { STORAGE_PREFIX, ERROR_MARGIN } from '../../utils/constants';
import { InputData } from '../../models/data/input-data';
import {
  validateMountPath,
  validateHDFSPathAsync,
} from '../../utils/validation';
import { WebHDFSClient } from '../../utils/webhdfs';

export const AddHDFS = ({
  dataList,
  setDataList,
  setDataType,
  hdfsClient,
  hdfsPathPrefix,
}) => {
  const [mountPath, setMountPath] = useState();
  const [isHdfsEnabled, setIsHdfsEnabled] = useState(true);
  const [hdfsPath, setHdfsPath] = useState();
  const [containerPathErrorMessage, setContainerPathErrorMessage] = useState(
    'Path should not be empty',
  );
  const [hdfsPathErrorMessage, setHdfsPathErrorMessage] = useState();

  useEffect(() => {
    if (!hdfsClient) {
      setIsHdfsEnabled(false);
      setHdfsPathErrorMessage('Pai HDFS is not available');
    } else {
      hdfsClient.checkAccess().then(isAccessiable => {
        setIsHdfsEnabled(isAccessiable);
        if (!isAccessiable) {
          setHdfsPathErrorMessage('Pai HDFS is not available');
        }
      });
    }
  }, []);

  const submitMount = async () => {
    if (hdfsClient) {
      try {
        await hdfsClient.readDir(hdfsPath);
      } catch (e) {
        alert(`${hdfsPath}: ${e.message}`);

        return;
      }
    }
    const newDataList = cloneDeep(dataList);
    newDataList.push(new InputData(mountPath, hdfsPath, 'hdfs'));
    setDataList(newDataList);
    setDataType('none');
  };

  return (
    <Stack horizontal horizontalAlign='space-between' gap='s'>
      <Stack.Item align='baseline'>
        <Label reqired className={FontClassNames.medium}>
          Container path
        </Label>
        <TextField
          prefix={STORAGE_PREFIX}
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
        <Label required className={FontClassNames.medium}>
          Path in pai HDFS
        </Label>
        <TextField
          required
          errorMessage={hdfsPathErrorMessage}
          onChange={async (_event, newValue) => {
            if (isNil(newValue)) {
              setHdfsPathErrorMessage('HDFS address should not be empty');
            } else {
              const valid = await validateHDFSPathAsync(newValue, hdfsClient);
              if (!valid.isLegal) {
                setHdfsPathErrorMessage(valid.illegalMessage);
              } else {
                setHdfsPathErrorMessage(null);
                setHdfsPath(newValue);
              }
            }
          }}
        />
      </Stack.Item>
      <Stack.Item align='end'>
        <IconButton
          iconProps={{ iconName: 'View' }}
          disabled={!isHdfsEnabled}
          styles={{
            root: {
              marginBottom:
                containerPathErrorMessage || hdfsPathErrorMessage
                  ? ERROR_MARGIN
                  : 0,
            },
            rootDisabled: {
              backgroundColor: 'transparent',
            },
          }}
          onClick={() => {
            window.open(`${hdfsClient.host}/explorer.html#/`);
          }}
        />
      </Stack.Item>
      <Stack.Item align='end'>
        <IconButton
          iconProps={{ iconName: 'Accept' }}
          disabled={containerPathErrorMessage || hdfsPathErrorMessage}
          styles={{
            root: {
              marginBottom:
                containerPathErrorMessage || hdfsPathErrorMessage
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
                containerPathErrorMessage || hdfsPathErrorMessage
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

AddHDFS.propTypes = {
  dataList: PropTypes.arrayOf(PropTypes.instanceOf(InputData)),
  setDataList: PropTypes.func,
  setDataType: PropTypes.func,
  hdfsClient: PropTypes.instanceOf(WebHDFSClient),
  hdfsPathPrefix: PropTypes.string,
};
