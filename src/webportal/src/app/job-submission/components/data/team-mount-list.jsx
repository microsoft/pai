import React, { useLayoutEffect } from 'react';
import c from 'classnames';
import {
  DetailsList,
  SelectionMode,
  FontClassNames,
  DetailsListLayoutMode,
} from 'office-ui-fabric-react';
import PropTypes from 'prop-types';

import { dispatchResizeEvent } from '../../utils/utils';
import t from '../../../components/tachyons.scss';
import { InputData } from '../../models/data/input-data';

export const TeamMountList = ({ dataList }) => {
  // workaround for fabric's bug
  // https://github.com/OfficeDev/office-ui-fabric-react/issues/5280#issuecomment-489619108
  useLayoutEffect(() => {
    dispatchResizeEvent();
  });

  const columes = [
    {
      key: 'containerPath',
      name: 'Container Path',
      headerClassName: FontClassNames.medium,
      minWidth: 100,
      onRender: (item, idx) => {
        return (
          <div className={FontClassNames.medium}>{`${item.mountPath}`}</div>
        );
      },
    },
    {
      key: 'dataSource',
      name: 'Data Source',
      headerClassName: FontClassNames.medium,
      isMultiline: true,
      minWidth: 200,
      onRender: item => {
        return (
          <div className={FontClassNames.medium}>{`${item.dataSource}`}</div>
        );
      },
    },
    {
      key: 'configName',
      name: 'Config Name',
      headerClassName: FontClassNames.medium,
      isMultiline: true,
      minWidth: 100,
      onRender: item => {
        return (
          <div className={FontClassNames.medium}>{`${item.sourceType}`}</div>
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
        layoutMode={DetailsListLayoutMode.fixedColumns}
        compact
      />
    </div>
  );
};

TeamMountList.propTypes = {
  dataList: PropTypes.arrayOf(PropTypes.instanceOf(InputData)),
};
