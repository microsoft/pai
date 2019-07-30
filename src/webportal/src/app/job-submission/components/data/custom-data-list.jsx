import React, {useCallback, useState, useEffect, useContext, useLayoutEffect} from 'react';
import c from 'classnames';
import {
  DetailsList,
  DetailsListLayoutMode,
  SelectionMode,
  IconButton,
  FontClassNames,
  TextField,
} from 'office-ui-fabric-react';
import {cloneDeep} from 'lodash';
import PropTypes from 'prop-types';

import {InputData} from '../../models/data/input-data';
import {removePathPrefix} from '../../utils/utils';
import {
  validateMountPath,
  validateHttpUrl,
  validateGitUrl,
  validateHDFSPathSync,
  validateNFSUrl,
  validateHDFSUrl,
} from '../../utils/validation';
import Context from '../context';
import {MOUNT_PREFIX} from '../../utils/constants';
import {dispatchResizeEvent} from '../../utils/utils';
import t from '../../../components/tachyons.scss';

const DATA_ERROR_MESSAGE_ID = 'Data Section';

const checkErrorMessage = async (
  dataList,
  containerPathErrorMessage,
  setContainerPathErrorMessage,
  dataSourceErrorMessage,
  setDataSourceErrorMessage,
  prefix,
) => {
  const newErrorMessage = cloneDeep(containerPathErrorMessage);
  const newDataSourceErrorMessage = cloneDeep(dataSourceErrorMessage);
  const mountPathList = [];
  dataList.forEach(async (dataItem, index) => {
    const validPath = validateMountPath(
      dataItem.mountPath.replace(prefix, '/'),
    );
    mountPathList.push(dataItem.mountPath);
    let validSource;
    if (!validPath.isLegal) {
      newErrorMessage[index] = validPath.illegalMessage;
    } else {
      newErrorMessage[index] = null;
    }
    switch (dataItem.sourceType) {
      case 'git':
        validSource = validateGitUrl(dataItem.dataSource);
        break;
      case 'http':
        validSource = validateHttpUrl(dataItem.dataSource);
        break;
      case 'hdfs':
        validSource = validateHDFSPathSync(dataItem.dataSource);
        break;
      case 'nfsmount':
        validSource = validateNFSUrl(dataItem.dataSource);
        break;
      case 'hdfsmount':
        validSource = validateHDFSUrl(dataItem.dataSource);
        break;
    }
    if (validSource && !validSource.isLegal) {
      newDataSourceErrorMessage[index] = validSource.illegalMessage;
    } else {
      newDataSourceErrorMessage[index] = null;
    }
  });
  if (prefix === MOUNT_PREFIX) {
    const mountPathListStr = mountPathList.join(',') + ',';
    mountPathList.forEach((mountPath, index) => {
      if (newErrorMessage[index] === null) {
        if (mountPathListStr.replace(mountPath + ',', '').indexOf(mountPath + ',') > -1) {
          newErrorMessage[index] = 'duplicated container path';
        }
      }
    });
  }
  setContainerPathErrorMessage(newErrorMessage);
  setDataSourceErrorMessage(newDataSourceErrorMessage);
};

export const CustomDataList = ({dataList, setDataList, setDataError, prefix}) => {
  // workaround for fabric's bug
  // https://github.com/OfficeDev/office-ui-fabric-react/issues/5280#issuecomment-489619108
  useLayoutEffect(() => {
    dispatchResizeEvent();
  });

  const [containerPathErrorMessage, setContainerPathErrorMessage] = useState(
    Array(dataList.length),
  );
  const [dataSourceErrorMessage, setDataSourceErrorMessage] = useState(
    Array(dataList.length),
  );
  const {setErrorMessage} = useContext(Context);

  useEffect(() => {
    checkErrorMessage(
      dataList,
      containerPathErrorMessage,
      setContainerPathErrorMessage,
      dataSourceErrorMessage,
      setDataSourceErrorMessage,
      prefix,
    );
  }, [dataList]);

  useEffect(() => {
    if (
      containerPathErrorMessage.every((element) => element === null) &&
      dataSourceErrorMessage.every((element) => element === null)
    ) {
      setErrorMessage(DATA_ERROR_MESSAGE_ID, null);
      setDataError({
        customContainerPathError: false,
        customDataSourceError: false,
      });
    } else {
      const newErrorMessage = containerPathErrorMessage.every(
        (element) => element === null,
      )
        ? dataSourceErrorMessage.find((element) => element !== null)
        : containerPathErrorMessage.find((element) => element !== null);
      setErrorMessage(
        DATA_ERROR_MESSAGE_ID,
        `DataSectionError: ${newErrorMessage}`,
      );
      setDataError({
        customContainerPathError: !containerPathErrorMessage.every(
          (element) => element === null,
        ),
        customDataSourceError: !dataSourceErrorMessage.every(
          (element) => element === null,
        ),
      });
    }
  }, [containerPathErrorMessage, dataSourceErrorMessage]);

  const onRemove = useCallback((idx) => {
    setDataList([...dataList.slice(0, idx), ...dataList.slice(idx + 1)]);
  });

  const onDataSourceChange = useCallback((idx, val) => {
    let updatedDataList = cloneDeep(dataList);
    updatedDataList[idx].dataSource = val;
    setDataList(updatedDataList);
  });
  const columes = [
    {
      key: 'containerPath',
      name: 'Container path',
      headerClassName: FontClassNames.medium,
      minWidth: 180,
      onRender: (item, idx) => {
        return (
          <TextField
            prefix={prefix}
            value={removePathPrefix(item.mountPath, prefix)}
            errorMessage={containerPathErrorMessage[idx]}
            onChange={(_event, newValue) => {
              let updatedDataList = cloneDeep(dataList);
              updatedDataList[idx].mountPath = `${prefix}${newValue}`;
              setDataList(updatedDataList);
            }}
          />
        );
      },
    },
    {
      key: 'dataSource',
      name: 'Data source',
      headerClassName: FontClassNames.medium,
      minWidth: 200,
      onRender: (item, idx) => {
        return (
          <TextField
            value={item.dataSource}
            disabled={item.sourceType === 'local'}
            errorMessage={dataSourceErrorMessage[idx]}
            onChange={(e, val) => onDataSourceChange(idx, val)}
          />
        );
      },
    },
    {
      key: 'remove',
      name: 'Remove',
      minWidth: 50,
      style: {padding: 0},
      headerClassName: FontClassNames.medium,
      onRender: (item, idx) => (
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'center',
            height: '100%',
          }}
        >
          <IconButton
            key={`remove-button-${idx}`}
            iconProps={{iconName: 'Delete'}}
            onClick={() => onRemove(idx)}
          />
        </div>
      ),
    },
  ];

  return (
    <div className={c(t.mb2)}>
      <DetailsList
        columns={columes}
        disableSelectionZone
        selectionMode={SelectionMode.none}
        items={dataList}
        layoutMode={DetailsListLayoutMode.fixedColumns}
        compact
      />
    </div>
  );
};

CustomDataList.propTypes = {
  dataList: PropTypes.arrayOf(PropTypes.instanceOf(InputData)),
  setDataList: PropTypes.func,
  setDataError: PropTypes.func,
  prefix: PropTypes.string,
};
