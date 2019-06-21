import React, {useCallback} from 'react';
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
import t from '../../../../app/components/tachyons.scss';

export const MountList = (props) => {
  const {dataList, setDataList} = props;

  const onRemove = useCallback((idx) => {
    let updatedDataList = dataList;
    if (idx !== undefined) {
      updatedDataList = updatedDataList.splice(idx, 1);
    }
    setDataList(updatedDataList);
  });
  const onMountPathChange = useCallback((idx, val) => {
    let updatedDataList = cloneDeep(dataList);
    updatedDataList[idx].mountPath = val;
    setDataList(updatedDataList);
  });
  const onDataSourceChange = useCallback((idx, val) => {
    let updatedDataList = cloneDeep(dataList);
    updatedDataList[idx].dataSource = val;
    setDataList(updatedDataList);
  });
  const columes = [
    {
      key: 'containerPath',
      name: 'Container Path',
      headerClassName: FontClassNames.medium,
      minWidth: 200,
      // eslint-disable-next-line react/display-name
      onRender: (item, idx) => {
        return (
          <TextField
            prefix={STORAGE_PREFIX}
            value={removePathPrefix(item.mountPath, STORAGE_PREFIX)}
            onChange={(e, val) => onMountPathChange(idx, val)}
          />
        );
      },
    },
    {
      key: 'dataSource',
      name: 'Data Source',
      headerClassName: FontClassNames.medium,
      maxWidth: 200,
      // eslint-disable-next-line react/display-name
      onRender: (item, idx) => {
        return (
          <TextField
            value={item.dataSource}
            disabled={item.sourceType === 'local'}
            onChange={(e, val) => onDataSourceChange(idx, val)}
            style={{root: {minWidth: 200}}}
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
