import React, { useState, useEffect } from 'react';
import {
  DefaultButton,
  Stack,
  TextField,
  IconButton,
  Label,
  FontClassNames,
  getTheme,
} from 'office-ui-fabric-react';
import { cloneDeep } from 'lodash';
import PropTypes from 'prop-types';

import { STORAGE_PREFIX, ERROR_MARGIN } from '../../utils/constants';
import { InputData } from '../../models/data/input-data';
import { validateMountPath } from '../../utils/validation';
import { WebHDFSClient } from '../../utils/webhdfs';

const { semanticColors } = getTheme();

export const AddLocal = ({
  dataList,
  setDataList,
  setDataType,
  hdfsClient,
}) => {
  const [mountPath, setMountPath] = useState();
  const [files, setFiles] = useState();
  const [uploadType, setUploadType] = useState('Files');
  const [errorMessage, setErrorMessage] = useState('Path should not be empty');
  const [hdfsErrorMessage, setHDFSErrorMessage] = useState();

  const uploadFile = React.createRef();
  const uploadFolder = React.createRef();

  useEffect(() => {
    if (!hdfsClient) {
      setHDFSErrorMessage('Cannot upload to pai right now');
    } else {
      hdfsClient.checkAccess().then(isAccessiable => {
        if (!isAccessiable) {
          setHDFSErrorMessage('Cannot upload to pai right now');
        }
      });
    }
  }, []);

  const getUploadText = () => {
    if (files === undefined) {
      return `Upload ${uploadType}`;
    } else if (files !== undefined && files.length === 1) {
      return files[0].name;
    } else if (files !== undefined && files.length > 1) {
      return `${files.length} Files`;
    }
  };
  const clickUpload = () => {
    if (uploadType === 'Files') {
      uploadFile.current.click();
    } else if (uploadType === 'Folder') {
      uploadFolder.current.click();
    }
  };
  const submitMount = () => {
    const newMountList = cloneDeep(dataList);
    const dataSource = files.map(file => file.name).join(', ');
    const uploadFiles = files;
    newMountList.push(
      new InputData(mountPath, dataSource, 'local', uploadFiles),
    );
    newMountList.sort((a, b) => {
      if (a.mountPath < b.mountPath) {
        return -1;
      }
      if (a.mountPath > b.mountPath) {
        return 1;
      }
      return 0;
    });
    setDataList(newMountList);
    setDataType('none');
  };
  return (
    <Stack horizontal horizontalAlign='space-between' gap='m'>
      <Stack.Item align='baseline'>
        <Label required className={FontClassNames.medium}>
          Container path
        </Label>
        <TextField
          prefix={STORAGE_PREFIX}
          styles={{ root: { width: 200 } }}
          errorMessage={errorMessage}
          onChange={(_event, newValue) => {
            const valid = validateMountPath(`/${newValue}`);
            if (!valid.isLegal) {
              setErrorMessage(valid.illegalMessage);
            } else {
              setErrorMessage(null);
              setMountPath(`${STORAGE_PREFIX}${newValue}`);
            }
          }}
        />
      </Stack.Item>
      <Stack.Item align='baseline'>
        <Label className={FontClassNames.medium}>Upload to pai</Label>
        <DefaultButton
          disabled={hdfsErrorMessage}
          iconProps={{ iconName: 'Upload' }}
          text={getUploadText()}
          errorMessage={errorMessage}
          split={true}
          onClick={clickUpload}
          menuProps={{
            items: [
              {
                key: 'Files',
                name: 'Files',
                onClick: (ev, item) => {
                  setUploadType(item.key);
                },
              },
              {
                key: 'Folder',
                name: 'Folder',
                onClick: (ev, item) => {
                  setUploadType(item.key);
                },
              },
            ],
          }}
        />
        {hdfsErrorMessage && (
          <span
            className={FontClassNames.small}
            style={{
              color: semanticColors.errorText,
              paddingTop: 5,
            }}
          >
            {hdfsErrorMessage}
          </span>
        )}
      </Stack.Item>
      <input
        type='file'
        ref={uploadFile}
        onChange={event => {
          const fileList = [];
          if (event.target.files !== null) {
            for (let i = 0; i < event.target.files.length; i += 1) {
              fileList.push(event.target.files[i]);
            }
          }
          setFiles(fileList);
        }}
        style={{ display: 'none' }}
        multiple
      />
      <input
        type='file'
        ref={uploadFolder}
        onChange={event => {
          const fileList = [];
          if (event.target.files !== null) {
            for (let i = 0; i < event.target.files.length; i += 1) {
              fileList.push(event.target.files[i]);
            }
          }
          setFiles(fileList);
        }}
        style={{ display: 'none' }}
        webkitdirectory=''
        multiple
      />
      <Stack.Item align='end'>
        <IconButton
          iconProps={{ iconName: 'Accept' }}
          disabled={errorMessage || hdfsErrorMessage}
          styles={{
            root: {
              marginBottom: errorMessage || hdfsErrorMessage ? ERROR_MARGIN : 0,
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
              marginBottom: errorMessage || hdfsErrorMessage ? ERROR_MARGIN : 0,
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

AddLocal.propTypes = {
  dataList: PropTypes.arrayOf(PropTypes.instanceOf(InputData)),
  setDataList: PropTypes.func,
  setDataType: PropTypes.func,
  hdfsClient: PropTypes.instanceOf(WebHDFSClient),
};
