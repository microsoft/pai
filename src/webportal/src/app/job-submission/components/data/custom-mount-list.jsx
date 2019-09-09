import React, {
  useCallback,
  useState,
  useEffect,
  useContext,
  useLayoutEffect,
} from 'react';
import c from 'classnames';
import {
  DetailsList,
  DetailsListLayoutMode,
  SelectionMode,
  IconButton,
  FontClassNames,
  TextField,
} from 'office-ui-fabric-react';
import { cloneDeep } from 'lodash';
import PropTypes from 'prop-types';

import { STORAGE_PREFIX } from '../../utils/constants';
import { InputData } from '../../models/data/input-data';
import { removePathPrefix, dispatchResizeEvent } from '../../utils/utils';
import {
  validateMountPath,
  validateHttpUrl,
  validateGitUrl,
  validateHDFSPathSync,
} from '../../utils/validation';
import Context from '../context';
import t from '../../../components/tachyons.scss';

const DATA_ERROR_MESSAGE_ID = 'Data Section';

const checkErrorMessage = async (
  dataList,
  containerPathErrorMessage,
  setContainerPathErrorMessage,
  dataSourceErrorMessage,
  setDataSourceErrorMessage,
) => {
  const newErrorMessage = cloneDeep(containerPathErrorMessage);
  const newDataSourceErrorMessage = cloneDeep(dataSourceErrorMessage);
  dataList.forEach(async (dataItem, index) => {
    const validPath = validateMountPath(
      dataItem.mountPath.replace(STORAGE_PREFIX, '/'),
    );
    let validSource;
    if (!validPath.isLegal) {
      newErrorMessage[index] = validPath.illegalMessage;
    } else {
      newErrorMessage[index] = null;
    }
    if (dataItem.sourceType === 'git') {
      validSource = validateGitUrl(dataItem.dataSource);
    } else if (dataItem.sourceType === 'http') {
      validSource = validateHttpUrl(dataItem.dataSource);
    } else if (dataItem.sourceType === 'hdfs') {
      validSource = validateHDFSPathSync(dataItem.dataSource);
    }
    if (validSource && !validSource.isLegal) {
      newDataSourceErrorMessage[index] = validSource.illegalMessage;
    } else {
      newDataSourceErrorMessage[index] = null;
    }
  });
  setContainerPathErrorMessage(newErrorMessage);
  setDataSourceErrorMessage(newDataSourceErrorMessage);
};

export const MountList = ({ dataList, setDataList, setDataError }) => {
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
  const { setErrorMessage } = useContext(Context);

  useEffect(() => {
    checkErrorMessage(
      dataList,
      containerPathErrorMessage,
      setContainerPathErrorMessage,
      dataSourceErrorMessage,
      setDataSourceErrorMessage,
    );
  }, [dataList]);

  useEffect(() => {
    if (
      containerPathErrorMessage.every(element => element === null) &&
      dataSourceErrorMessage.every(element => element === null)
    ) {
      setErrorMessage(DATA_ERROR_MESSAGE_ID, null);
      setDataError({
        customContainerPathError: false,
        customDataSourceError: false,
      });
    } else {
      const newErrorMessage = containerPathErrorMessage.every(
        element => element === null,
      )
        ? dataSourceErrorMessage.find(element => element !== null)
        : containerPathErrorMessage.find(element => element !== null);
      setErrorMessage(
        DATA_ERROR_MESSAGE_ID,
        `DataSectionError: ${newErrorMessage}`,
      );
      setDataError({
        customContainerPathError: !containerPathErrorMessage.every(
          element => element === null,
        ),
        customDataSourceError: !dataSourceErrorMessage.every(
          element => element === null,
        ),
      });
    }
  }, [containerPathErrorMessage, dataSourceErrorMessage]);

  const onRemove = useCallback(idx => {
    setDataList([...dataList.slice(0, idx), ...dataList.slice(idx + 1)]);
  });

  const onDataSourceChange = useCallback((idx, val) => {
    const updatedDataList = cloneDeep(dataList);
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
            prefix={STORAGE_PREFIX}
            value={removePathPrefix(item.mountPath, STORAGE_PREFIX)}
            errorMessage={containerPathErrorMessage[idx]}
            onChange={(_event, newValue) => {
              const updatedDataList = cloneDeep(dataList);
              updatedDataList[idx].mountPath = `${STORAGE_PREFIX}${newValue}`;
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
      style: { padding: 0 },
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
            iconProps={{ iconName: 'Delete' }}
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

MountList.propTypes = {
  dataList: PropTypes.arrayOf(PropTypes.instanceOf(InputData)),
  setDataList: PropTypes.func,
  setDataError: PropTypes.func,
};
