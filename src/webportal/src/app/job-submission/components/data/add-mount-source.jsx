import React, {useState} from 'react';
import c from 'classnames';
import {PrimaryButton} from 'office-ui-fabric-react/lib/Button';
import PropTypes from 'prop-types';

import {AddNFSMount} from './add-nfs-mount';
import {AddHDFSMount} from './add-hdfs-mount';
import {InputData} from '../../models/data/input-data';

import t from '../../../../app/components/tachyons.scss';

export const AddMountSource = (props) => {
  const {mountList, setMountList} = props;
  const [mountType, setMountType] = useState();

  const menuItems = [
    {
      key: 'nfs',
      text: 'From NFS',
      iconProps: {iconName: 'InternetSharing'},
      onClick: () => {
        setMountType('nfs');
      },
    },
    {
      key: 'hdfs',
      text: 'From HDFS',
      iconProps: {iconName: 'Cloudy'},
      onClick: () => {
        setMountType('hdfs');
      },
    },
  ];

  return (
    <div>
      <PrimaryButton
        iconProps={{iconName: 'Add'}}
        text='Add mount source'
        menuProps={{items: menuItems}}
      />
      <div className={c(t.mb1)}>
        {mountType === 'nfs' && (
          <AddNFSMount
            mountList={mountList}
            setMountList={setMountList}
            setMountType={setMountType}
          />
        )}
        {mountType === 'hdfs' && (
          <AddHDFSMount
            mountList={mountList}
            setMountList={setMountList}
            setMountType={setMountType}
          />
        )}
      </div>
    </div>
  );
};

AddMountSource.propTypes = {
  mountList: PropTypes.arrayOf(PropTypes.instanceOf(InputData)),
  setMountList: PropTypes.func,
};
