import React, {useState} from 'react';
import {
  DefaultButton,
  Stack,
  TextField,
  IconButton,
} from 'office-ui-fabric-react';
import {cloneDeep} from 'lodash';
import PropTypes from 'prop-types';

import {STORAGE_PREFIX} from '../../utils/constants';
import {InputData} from '../../models/data/input-data';
import {validateMountPath} from '../../utils/validation';

export const AddLocal = ({dataList, setDataList, setDataType}) => {
  const [mountPath, setMountPath] = useState();
  const [files, setFiles] = useState();
  const [uploadType, setUploadType] = useState('Files');
  const [errorMessage, setErrorMessage] = useState('Path should not be empty');

  const uploadFile = React.createRef();
  const uploadFolder = React.createRef();
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
    const dataSource = files.map((file) => file.name).join(', '); // eslint-disable-line @typescript-eslint/no-explicit-any
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
    <Stack horizontal horizontalAlign='space-between'>
      <TextField
        required
        prefix={STORAGE_PREFIX}
        label='Container Path'
        styles={{root: {minWidth: 200}}}
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
      <Stack.Item align='end'>
        <DefaultButton
          iconProps={{iconName: 'Upload'}}
          text={getUploadText()}
          split={true}
          onClick={clickUpload}
          styles={{
            root: {
              minWidth: 200,
            },
            splitButtonContainer: {
              marginBottom: errorMessage ? 22.15 : 0,
            },
          }}
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
      </Stack.Item>
      <input
        type='file'
        ref={uploadFile}
        onChange={(event) => {
          const fileList = [];
          if (event.target.files !== null) {
            for (let i = 0; i < event.target.files.length; i += 1) {
              fileList.push(event.target.files[i]);
            }
          }
          setFiles(fileList);
        }}
        style={{display: 'none'}}
        multiple
      />
      <input
        type='file'
        ref={uploadFolder}
        onChange={(event) => {
          const fileList = [];
          if (event.target.files !== null) {
            for (let i = 0; i < event.target.files.length; i += 1) {
              fileList.push(event.target.files[i]);
            }
          }
          setFiles(fileList);
        }}
        style={{display: 'none'}}
        webkitdirectory=''
        multiple
      />
      <Stack.Item align='end'>
        <IconButton
          iconProps={{iconName: 'Accept'}}
          disabled={errorMessage}
          styles={{
            root: {
              marginBottom: errorMessage ? 22.15 : 0,
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
              marginBottom: errorMessage ? 22.15 : 0,
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
};
