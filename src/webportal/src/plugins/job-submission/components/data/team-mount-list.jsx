import React from 'react';
import c from 'classnames';
import {FontClassNames} from '@uifabric/styling';
import {
  DetailsList,
  SelectionMode,
} from 'office-ui-fabric-react/lib/DetailsList';
import PropTypes from 'prop-types';

import {InputData} from '../../models/data/input-data';
import t from '../../../../app/components/tachyons.scss';

export const TeamMountList = ({dataList, setDataList}) => {
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

TeamMountList.propTypes = {
  dataList: PropTypes.arrayOf(PropTypes.instanceOf(InputData)),
  setDataList: PropTypes.func,
  setDataType: PropTypes.func,
};
