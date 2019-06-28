import React from 'react';
import c from 'classnames';
import {FontClassNames} from '@uifabric/styling';
import {
  TextField,
  DetailsList,
  SelectionMode,
} from 'office-ui-fabric-react';
import PropTypes from 'prop-types';
import {cloneDeep} from 'lodash';

import {STORAGE_PREFIX} from '../../utils/constants';
import {removePathPrefix} from '../../utils/utils';
import {validateMountPath} from '../../utils/validation';
import t from '../../../components/tachyons.scss';
import {MountDirectories} from '../../models/data/mount-directories';

const checkErrorMessage = async (
  dataList,
  containerPathErrorMessage,
  setContainerPathErrorMessage,
) => {
  const newErrorMessage = cloneDeep(containerPathErrorMessage);
  dataList.forEach(async (dataItem, index) => {
    const validPath = validateMountPath(
      dataItem.mountPath.replace(STORAGE_PREFIX, ''),
    );
    let validSource;
    if (!validPath.isLegal) {
      newErrorMessage[index] = validPath.illegalMessage;
    } else {
      newErrorMessage[index] = null;
    }
  });
  setContainerPathErrorMessage(newErrorMessage);
  setDataSourceErrorMessage(newDataSourceErrorMessage);
};

export const TeamMountList = ({mountDirs, setMountDirs}) => {
  const dataList = mountDirs ? [] : mountDirs.getTeamDataList();
  const [containerPathErrorMessage, setContainerPathErrorMessage] = useState(
    Array(dataList.length),
  );

  const columes = [
    {
      key: 'containerPath',
      name: 'Container Path',
      headerClassName: FontClassNames.medium,
      minWidth: 200,
      onRender: (item, idx) => {
        return (
          <TextField
            value={removePathPrefix(item.mountPath)}
            errorMessage={containerPathErrorMessage[idx]}
            onChange={(_event, newValue) => {
              let updatedDataList = cloneDeep(dataList);
              updatedDataList[idx].mountPath = newValue;
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
  mountDirs: PropTypes.arrayOf(PropTypes.instanceOf(MountDirectories)),
  setMountDirs: PropTypes.func,
};
