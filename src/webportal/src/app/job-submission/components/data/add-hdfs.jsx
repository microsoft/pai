import React, {useState, useEffect} from 'react';
import c from 'classnames';
import {PrimaryButton} from 'office-ui-fabric-react/lib/Button';
import {TextField} from 'office-ui-fabric-react/lib/TextField';
import {cloneDeep} from 'lodash';
import {TagPicker, ITag} from 'office-ui-fabric-react/lib/Pickers';
import {FontClassNames} from '@uifabric/styling';
import PropTypes from 'prop-types';

import {InputData} from '../../models/data/input-data';
import t from '../../../../app/components/tachyons.scss';

const STORAGE_PREFIX = '/test';

// interface Props {
//   mountList: MountItem[]
//   setMountList: (mountList: MountItem[]) => void
//   setMountType: (mountType: string) => void
//   hdfsClient?: WebHDFSClient
//   hdfsPathPrefix: string
// }

export const AddHDFS = (props) => {
  const {dataList, setDataList, setDataType} = props;
  const [mountPath, setMountPath] = useState();
  const [isHdfsEnabled, setIsHdfsEnabled] = useState(true);
  const [hdfsPath, setHdfsPath] = useState();
  // useEffect(() => {
  //   if (!hdfsClient) {
  //     setIsHdfsEnabled(false);
  //   } else {
  //     hdfsClient.checkAccess().then((isAccessiable) => {
  //       setIsHdfsEnabled(isAccessiable);
  //     });
  //   }
  // }, []);
  const submitMount = async () => {
    if (!mountPath) {
      alert('please input the path in container');

      return;
    }
    // const valid = validateMountPath(mountPath);
    // if (!valid.isLegal) {
    //   alert(valid.illegalMessage);

    //   return;
    // }
    if (!hdfsPath) {
      alert('please input the path in PAI HDFS');

      return;
    }
    // if (hdfsClient) {
    //   try {
    //     await hdfsClient.readDir(hdfsPath);
    //   } catch (e) {
    //     alert(`${hdfsPath}: ${e.message}`);

    //     return;
    //   }
    // } else {
    //   const validHDFS = validateHDFSPath(hdfsPath);
    //   if (!validHDFS.isLegal) {
    //     alert(valid.illegalMessage);

    //     return;
    //   }
    // }
    const newDataList = cloneDeep(dataList);
    newDataList.push({mountPath, dataSource: hdfsPath, sourceType: 'hdfs'});
    setDataList(newDataList);
    setDataType('none');
  };
  const onFilterChanged = async (filterText) => {
  //   if (!isHdfsEnabled || !hdfsClient) {
  //     return [];
  //   }
  //   let result: string[];
  //   try {
  //     const pathPrefix = filterText.slice(0, filterText.lastIndexOf('/') + 1);
  //     result = await hdfsClient.readDir(`${hdfsPathPrefix}${pathPrefix}`);
  //     const resultTags = result
  //       .filter((path) => {
  //         if (filterText.lastIndexOf('/') === filterText.length - 1) {
  //           return true;
  //         }
  //         const partPath = filterText.split('/').pop();
  //         if (!partPath) {
  //           return [];
  //         }
  //         return path.includes(partPath);
  //       })
  //       .map((pathSuffix) => {
  //         return {
  //           name: pathSuffix,
  //           key: `${pathPrefix}${pathSuffix}`,
  //         };
  //       });
  //     return resultTags;
  //   } catch (e) {
  //     return [];
  //   }
    return [];
  };
  const onItemSelected = (selectedItem) => {
  //   if (!selectedItem) {
  //     return null;
  //   }
  //   setHdfsPath(selectedItem.key);
  //   return {
  //     name: selectedItem.key,
  //     key: selectedItem.key,
  // };
    return null;
  };
  return (
    <div>
      <div className={c(t.flex, t.itemsEnd, t.justifyBetween)}>
        <TextField
          required={true} // eslint-disable-line react/jsx-boolean-value
          prefix={STORAGE_PREFIX}
          label='The path in container'
          className={c(t.w5, t.mr3)}
          onChange={(_event, newValue) => {
            setMountPath(`${STORAGE_PREFIX}${newValue}`);
          }}
        />
        <div>
          <div className={c(t.flex, t.itemsCenter)}>
            <div className={c(FontClassNames.smallPlus)}>
              The path in PAI HDFS
            </div>
            <div className={c(t.red, t.mb2)}>*</div>
          </div>
          <TagPicker
            onResolveSuggestions={onFilterChanged}
            onItemSelected={onItemSelected}
            pickerSuggestionsProps={{
              suggestionsHeaderText: 'path in hdfs should start with /',
              noResultsFoundText: 'path not found',
            }}
            itemLimit={1}
          />
        </div>
        <PrimaryButton
          text='view'
          disabled={!isHdfsEnabled}
          onClick={() => {
            window.open('http://10.151.40.234:50070/explorer.html#/');
          }}
          className={c(t.mr2)}
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

AddHDFS.propTypes = {
  dataList: PropTypes.arrayOf(PropTypes.instanceOf(InputData)),
  setDataList: PropTypes.func,
  setDataType: PropTypes.func,
};
