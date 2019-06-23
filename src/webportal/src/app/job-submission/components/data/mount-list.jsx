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
  const [containerPathErrorMessage, setContainerPathErrorMessage] = useState();
  const [dataSourceErrorMessage, setDataSourceErrorMessage] = useState();

  const onRemove = useCallback((idx) => {
    setDataList(([...dataList.slice(0, idx), ...dataList.slice(idx + 1)]));
  });

  const onDataSourceChange = useCallback((idx, val) => {
    let valid;
    let updatedDataList = cloneDeep(dataList);
    if (updatedDataList[idx].sourceType === 'git') {
      valid = validateGitUrl(val);
    }
    if (valid && !valid.isLegal) {
      setDataSourceErrorMessage(valid.illegalMessage);
    } else {
      setDataSourceErrorMessage(null);
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
            errorMessage={containerPathErrorMessage}
            onChange={(_event, newValue) => {
              const valid = validateMountPath(newValue);
              if (!valid.isLegal) {
                setContainerPathErrorMessage(valid.illegalMessage);
              } else {
                setContainerPathErrorMessage(null);
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
            errorMessage={dataSourceErrorMessage}
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
