import React, {useState} from 'react';
import c from 'classnames';
import {PrimaryButton} from 'office-ui-fabric-react/lib/Button';
import {TextField} from 'office-ui-fabric-react/lib/TextField';
import {cloneDeep} from 'lodash';
import {FontClassNames} from '@uifabric/styling';
import {Icon} from 'office-ui-fabric-react/lib/Icon';
import {Dropdown} from 'office-ui-fabric-react/lib/Dropdown';
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
    newMountList.push({
      mountPath,
      dataSource,
      sourceType: 'local',
      uploadFiles,
    });
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
      <div className={c(t.flex, t.itemsEnd, t.justifyBetween)}>
        <TextField
          required
          prefix={STORAGE_PREFIX}
          label='The path in container'
          onChange={(_event, newValue) => {
            setMountPath(`${STORAGE_PREFIX}${newValue}`);
          }}
          className={c(t.w20)}
        />
        <label
          htmlFor='upload'
          className={c(
            FontClassNames.medium,
            t.flex,
            t.itemsCenter,
            t.w20,
            t.h2,
            t.bgLightGray,
          )}
        >
          {uploadType === 'Files' && (
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
          )}
          {uploadType === 'Folder' && (
            // @ts-ignore
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
          )}
          <Icon iconName='Upload' className={c(t.mh2, t.pt1)} />
          <div className={c(t.w4)}>
            {files === undefined && `Upload ${uploadType}`}
            {files !== undefined && files.length === 1 && files[0].name}
            {files !== undefined && files.length > 1 && `${files.length} Files`}
          </div>
        </label>
        <Dropdown
          placeholder='Files'
          options={[
            {
              key: 'files',
              text: 'Files',
              title: 'select files to upload',
            },
            {key: 'folder', text: 'Folder', title: 'select folder to upload'},
          ]}
          className={c(t.w4, t.mr4)}
          onChange={(_event, item) => {
            if (item !== undefined) {
              setUploadType(item.text);
            }
          }}
        />
        <PrimaryButton
          text='submit'
          className={c(t.mr2)}
          onClick={submitMount}
        />
        <PrimaryButton
          text='cancel'
          onClick={() => {
            setDataType('none');
          }}
        />
      </div>
    </div>
  );
};

AddLocal.propTypes = {
  dataList: PropTypes.arrayOf(PropTypes.instanceOf(InputData)),
  setDataList: PropTypes.func,
  setDataType: PropTypes.func,
};
