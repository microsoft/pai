import React, {useState} from 'react';
import c from 'classnames';
import {PrimaryButton} from 'office-ui-fabric-react/lib/Button';
import PropTypes from 'prop-types';

import {AddHttpAtt} from './add-http-att';
import {AddLocalAtt} from './add-local-att';
import {AddGitAtt} from './add-git-att';
import {AddHDFSAtt} from './add-hdfs-att';
import {InputData} from '../../models/data/input-data';
import {HdfsContext} from '../../models/data/hdfs-context';

import t from '../../../../app/components/tachyons.scss';

export const AddAttSource = (props) => {
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
        text='Add attachment source'
        menuProps={{items: menuItems}}
      />
      <div className={c(t.mb1)}>
        {dataType === 'local' && (
          <HdfsContext.Consumer>
            {(value) => (
              <AddLocalAtt
                dataList={dataList}
                setDataList={setDataList}
                setDataType={setDataType}
                hdfsClient={value.hdfsClient}
              />
            )}
          </HdfsContext.Consumer>
        )}
        {dataType === 'http' && (
          <AddHttpAtt
            dataList={dataList}
            setDataList={setDataList}
            setDataType={setDataType}
          />
        )}
        {dataType === 'git' && (
          <AddGitAtt
            dataList={dataList}
            setDataList={setDataList}
            setDataType={setDataType}
          />
        )}
        {dataType === 'hdfs' && (
          <HdfsContext.Consumer>
            {(value) => (
              <AddHDFSAtt
                dataList={dataList}
                setDataList={setDataList}
                setDataType={setDataType}
                hdfsClient={value.hdfsClient}
                hdfsPathPrefix='/'
              />
            )}
          </HdfsContext.Consumer>
        )}
      </div>
    </div>
  );
};

AddAttSource.propTypes = {
  dataList: PropTypes.arrayOf(PropTypes.instanceOf(InputData)),
  setDataList: PropTypes.func,
};
