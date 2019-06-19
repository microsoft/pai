import React, {useState} from 'react';
import c from 'classnames';
import {
  DefaultButton,
  CommandBarButton,
  Stack,
  TextField,
  FontClassNames,
  Icon,
  Dropdown,
} from 'office-ui-fabric-react';
import {cloneDeep} from 'lodash';
import PropTypes from 'prop-types';

import {InputData} from '../../models/data/input-data';
import t from '../../../../app/components/tachyons.scss';

const STORAGE_PREFIX = '/test';

export const AddLocal = (props) => {
  const {dataList, setDataList, setDataType} = props;
  const [mountPath, setMountPath] = useState();
  const [files, setFiles] = useState();
  const [uploadType, setUploadType] = useState('Files');
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
    <div>
      <Stack horizontal horizontalAlign='space-between' className={c(t.pb2)}>
        <TextField
          required
          prefix={STORAGE_PREFIX}
          label='Container Path'
          onChange={(_event, newValue) => {
            setMountPath(`${STORAGE_PREFIX}${newValue}`);
          }}
          styles={{minWidth: 150}}
        />
        <Stack.Item align='end'>
          <DefaultButton
            iconProps={{iconName: 'Upload'}}
            text='upload file'
            split={true}
            onClick={() => {
              console.log('click');
            }}
            menuProps={{
              items: [
                {key: 'file', name: 'Files', icon: 'File'},
                {key: 'folder', name: 'Folder', icon: 'Folder'},
              ],
            }}
          />
        </Stack.Item>
        <input
          id='upload'
          type='file'
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
          id='upload'
          type='file'
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

        {/* <div>
        <Icon iconName='Upload' className={c(t.mh2, t.h2)} />
        <div className={c(t.w4)}>
          {files === undefined && `Upload ${uploadType}`}
          {files !== undefined && files.length === 1 && files[0].name}
          {files !== undefined && files.length > 1 && `${files.length} Files`}
        </div>
      </div> */}
      </Stack>
      <Stack horizontal horizontalAlign='end'>
        <DefaultButton text='add' className={c(t.mr2)} onClick={submitMount} />
        <DefaultButton
          text='cancel'
          onClick={() => {
            setDataType('none');
          }}
        />
      </Stack>
    </div>
  );
};

AddLocal.propTypes = {
  dataList: PropTypes.arrayOf(PropTypes.instanceOf(InputData)),
  setDataList: PropTypes.func,
  setDataType: PropTypes.func,
};
