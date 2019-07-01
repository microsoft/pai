import React, {useState, useEffect} from 'react';
import {cloneDeep} from 'lodash';
import c from 'classnames';
import {
  TextField,
  TagPicker,
  FontClassNames,
  Stack,
  IconButton,
} from 'office-ui-fabric-react';
import PropTypes from 'prop-types';

import {STORAGE_PREFIX} from '../../utils/constants';
import {InputData} from '../../models/data/input-data';
import {validateMountPath, validateHDFSPathAsync} from '../../utils/validation';
import {WebHDFSClient} from '../../utils/webhdfs';

import t from '../../../../app/components/tachyons.scss';

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
  const [containerPathErrorMessage, setContainerPathErrorMessage] = useState('Path should not be empty');
  const [hdfsPathErrorMessage, setHdfsPathErrorMessage] = useState();

  useEffect(() => {
    if (!hdfsClient) {
      setIsHdfsEnabled(false);
    } else {
      hdfsClient.checkAccess().then((isAccessiable) => {
        setIsHdfsEnabled(isAccessiable);
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

  const onFilterChanged = async (filterText) => {
    if (!isHdfsEnabled || !hdfsClient) {
      return [];
    }
    let result;
    try {
      const pathPrefix = filterText.slice(0, filterText.lastIndexOf('/') + 1);
      result = await hdfsClient.readDir(`${hdfsPathPrefix}${pathPrefix}`);
      const resultTags = result
        .filter((path) => {
          if (filterText.lastIndexOf('/') === filterText.length - 1) {
            return true;
          }
          const partPath = filterText.split('/').pop();
          if (!partPath) {
            return [];
          }
          return path.includes(partPath);
        })
        .map((pathSuffix) => {
          return {
            name: pathSuffix,
            key: `${pathPrefix}${pathSuffix}`,
          };
        });
      return resultTags;
    } catch (e) {
      return [];
    }
  };
  const onItemSelected = async (selectedItem) => {
      if (!selectedItem) {
        return null;
      }
      const hdfsPath = selectedItem.key;
      setHdfsPath(hdfsPath);
      const valid = await validateHDFSPathAsync(hdfsPath, hdfsClient);
      if (!valid.isLegal) {
        setHdfsPathErrorMessage(valid.illegalMessage);
      } else {
        setHdfsPathErrorMessage(null);
      }
      return {
        name: selectedItem.key,
        key: selectedItem.key,
    };
  };

  return (
    <Stack horizontal horizontalAlign='space-between'>
      <div>
        <Stack horizontal>
          <div className={c(FontClassNames.smallPlus)}>Container Path</div>
          <div className={c(t.red, t.pl1, t.mb2)}>*</div>
        </Stack>
        <TextField
          prefix={STORAGE_PREFIX}
          errorMessage={containerPathErrorMessage}
          styles={{
            root: {
              width: 200,
              marginBottom: hdfsPathErrorMessage
                ? containerPathErrorMessage
                  ? 0
                  : 22.15
                : 0,
            },
          }}
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
      </div>
      <div>
        <Stack horizontal>
          <div className={c(FontClassNames.smallPlus)}>
            The path in PAI HDFS
          </div>
          <div className={c(t.red, t.pl1, t.mb2)}>*</div>
        </Stack>
        <TagPicker
          onResolveSuggestions={onFilterChanged}
          onItemSelected={onItemSelected}
          pickerSuggestionsProps={{
            suggestionsHeaderText: 'path in hdfs should start with /',
            noResultsFoundText: 'path not found',
          }}
          itemLimit={1}
          styles={{
            root: {
              width: 200,
              marginBottom: containerPathErrorMessage
                ? hdfsPathErrorMessage
                  ? 0
                  : 22.15
                : 0,
            },
          }}
        />
      </div>
      <Stack.Item align='end'>
        <IconButton
          iconProps={{iconName: 'View'}}
          disabled={!isHdfsEnabled}
          styles={{
            root: {
              marginBottom:
                containerPathErrorMessage || hdfsPathErrorMessage ? 22.15 : 0,
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
          iconProps={{iconName: 'Accept'}}
          disabled={containerPathErrorMessage || hdfsPathErrorMessage}
          styles={{
            root: {
              marginBottom:
                containerPathErrorMessage || hdfsPathErrorMessage ? 22.15 : 0,
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
              marginBottom:
                containerPathErrorMessage || hdfsPathErrorMessage ? 22.15 : 0,
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
