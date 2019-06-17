import React from 'react';
import c from 'classnames';
import {FontClassNames} from '@uifabric/styling';
import {
  DetailsList,
  IColumn,
  SelectionMode,
} from 'office-ui-fabric-react/lib/DetailsList';
import {PrimaryButton} from 'office-ui-fabric-react/lib/Button';
import {cloneDeep} from 'lodash';
import PropTypes from 'prop-types';

import {InputData} from '../../models/data/input-data';
import t from '../../../../app/components/tachyons.scss';

export const MountList = (props) => {
  const {dataList, setDataList} = props;
  const columes = [
    {
      key: 'mountPath',
      name: 'Mount path inside container',
      headerClassName: FontClassNames.medium,
      minWidth: 50,
      maxWidth: 200,
      // eslint-disable-next-line react/display-name
      onRender: (item) => {
        return <div className={FontClassNames.medium}>{item.mountPath}</div>;
      },
    },
    {
      key: 'dataSource',
      name: 'Data Source',
      headerClassName: FontClassNames.medium,
      minWidth: 50,
      maxWidth: 400,
      // eslint-disable-next-line react/display-name
      onRender: (item) => {
        return (
          <div className={FontClassNames.medium}>{`${item.dataSource} ( ${
            item.sourceType
          } )`}</div>
        );
      },
    },
    {
      key: 'actions',
      name: 'Actions',
      headerClassName: FontClassNames.medium,
      minWidth: 50,
      // eslint-disable-next-line react/display-name
      onRender: (_item, index) => {
        return (
          <div className={c(t.flex)}>
            <PrimaryButton
              text='Delete'
              onClick={() => {
                const newDataList = cloneDeep(dataList);
                if (index !== undefined) {
                  newDataList.splice(index, 1);
                }
                setDataList(newDataList);
              }}
            />
          </div>
        );
      },
    },
  ];

  return (
    <div className={c(t.mb2)}>
      <DetailsList
        columns={columes}
        disableSelectionZone
        selectionMode={SelectionMode.none}
        items={dataList}
      />
    </div>
  );
};

MountList.propTypes = {
  dataList: PropTypes.arrayOf(PropTypes.instanceOf(InputData)),
  setDataList: PropTypes.func,
  setDataType: PropTypes.func,
};
