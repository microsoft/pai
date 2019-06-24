import React, {useCallback, useState} from 'react';
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

import {STORAGE_PREFIX} from '../../utils/constants';
import {InputData} from '../../models/data/input-data';
import {removePathPrefix} from '../../utils/utils';
import {validateMountPath, validateGitUrl} from '../../utils/validation';
import t from '../../../components/tachyons.scss';

export const MountList = ({dataList, setDataList}) => {
  const [containerPathErrorMessage, setContainerPathErrorMessage] = useState(Array(dataList.length));
  const [dataSourceErrorMessage, setDataSourceErrorMessage] = useState(Array(dataList.length));

  const onRemove = useCallback((idx) => {
    setDataList(([...dataList.slice(0, idx), ...dataList.slice(idx + 1)]));
  });

  const onDataSourceChange = useCallback((idx, val) => {
    let valid;
    let updatedDataList = cloneDeep(dataList);
    if (updatedDataList[idx].sourceType === 'git') {
      valid = validateGitUrl(val);
    }
    const newDataSourceErrorMessage = cloneDeep(dataSourceErrorMessage);
    if (valid && !valid.isLegal) {
      newDataSourceErrorMessage[idx] = valid.illegalMessage;
      setDataSourceErrorMessage(newDataSourceErrorMessage);
    } else {
      newDataSourceErrorMessage[idx] = null;
      setDataSourceErrorMessage(newDataSourceErrorMessage);
    }
    updatedDataList[idx].dataSource = val;
    setDataList(updatedDataList);
  });
  const columes = [
    {
      key: 'containerPath',
      name: 'Container Path',
      headerClassName: FontClassNames.medium,
      minWidth: 200,
      onRender: (item, idx) => {
        return (
          <TextField
            prefix={STORAGE_PREFIX}
            value={removePathPrefix(item.mountPath, STORAGE_PREFIX)}
            errorMessage={containerPathErrorMessage[idx]}
            onChange={(_event, newValue) => {
              const valid = validateMountPath(newValue);
              const newErrorMessage = cloneDeep(containerPathErrorMessage);
              if (!valid.isLegal) {
                newErrorMessage[idx] = valid.illegalMessage;
                setContainerPathErrorMessage(newErrorMessage);
              } else {
                newErrorMessage[idx] = null;
                setContainerPathErrorMessage(newErrorMessage);
              }
              let updatedDataList = cloneDeep(dataList);
              updatedDataList[idx].mountPath = `${STORAGE_PREFIX}${newValue}`;
              setDataList(updatedDataList);
            }}
          />
        );
      },
    },
    {
      key: 'dataSource',
      name: 'Data Source',
      headerClassName: FontClassNames.medium,
      maxWidth: 230,
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
      onRender: (item, idx) => (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
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

MountList.propTypes = {
  dataList: PropTypes.arrayOf(PropTypes.instanceOf(InputData)),
  setDataList: PropTypes.func,
  setDataType: PropTypes.func,
};
