import React, {useState} from 'react';
import c from 'classnames';
import {PrimaryButton} from 'office-ui-fabric-react/lib/Button';
import PropTypes from 'prop-types';

// import {AddHttp} from './addHttp';
import {AddLocal} from './addLocal';
// // import {AddGit} from './addGit';
// import {AddHDFS} from './addHDFS';
import {InputData} from '../../models/data/input-data';

import t from '../../../../app/components/tachyons.scss';

export const AddDataSource = (props) => {
  const {dataList, setDataList} = props;
  const [dataType, setDataType] = useState();

  const menuItems = [
    {
      key: 'local',
      text: 'From local ( size<1G )',
      iconProps: {iconName: 'Documentation'},
      onClick: () => {
        setDataType('local');
      },
    },
    {
      key: 'http',
      text: 'From http/https source',
      iconProps: {iconName: 'InternetSharing'},
      onClick: () => {
        setDataType('http');
      },
    },
    {
      key: 'git',
      text: 'From github public repo',
      iconProps: {iconName: 'GitGraph'},
      onClick: () => {
        setDataType('git');
      },
    },
    {
      key: 'hdfs',
      text: 'From PAI HDFS',
      iconProps: {iconName: 'Cloudy'},
      onClick: () => {
        setDataType('hdfs');
      },
    },
  ];

  return (
    <div>
      <PrimaryButton
        iconProps={{iconName: 'Add'}}
        text='Add Data Source'
        menuProps={{items: menuItems}}
      />
      <div className={c(t.mb2)}>
        {dataType === 'local' && (
          <AddLocal
            dataList={dataList}
            setDataList={setDataList}
            setDataType={setDataType}
          />
        )}
        {/* {dataType === 'http' && (
          <AddHttp
            dataList={dataList}
            setDataList={setDataList}
            setDataType={setDataType}
          />
        )}
        {dataType === 'git' && (
          <AddGit
            dataList={dataList}
            setDataList={setDataList}
            setDataType={setDataType}
          />
        )} */}
        {/* {dataType === 'hdfs' && (
          <Context.Consumer>
            {value => (
              <AddHDFS
                mountList={mountList}
                setMountList={setMountList}
                setMountType={setMountType}
                hdfsClient={value.hdfsClient}
                hdfsPathPrefix='/'
              />
            )}
          </Context.Consumer>
        )} */}
      </div>
    </div>
  );
};

AddDataSource.propTypes = {
  dataList: PropTypes.arrayOf(PropTypes.instanceOf(InputData)),
  setDataList: PropTypes.func,
};
