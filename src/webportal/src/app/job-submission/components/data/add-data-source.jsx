import React, { useState } from 'react';
import c from 'classnames';
import { PrimaryButton } from 'office-ui-fabric-react/lib/Button';
import PropTypes from 'prop-types';

import { AddHttp } from './add-http';
import { AddLocal } from './add-local';
import { AddGit } from './add-git';
import { AddHDFS } from './add-hdfs';
import { InputData } from '../../models/data/input-data';
import { HdfsContext } from '../../models/data/hdfs-context';

import config from '../../../config/webportal.config';
import t from '../../../../app/components/tachyons.scss';

export const AddDataSource = props => {
  const { dataList, setDataList } = props;
  const [dataType, setDataType] = useState();

  const menuItems = [
    {
      key: 'local',
      text: 'From local ( size<1G )',
      iconProps: { iconName: 'Documentation' },
      className: config.launcherType === 'k8s' ? c(t.dn) : null,
      onClick: () => {
        setDataType('local');
      },
    },
    {
      key: 'http',
      text: 'From http/https source',
      iconProps: { iconName: 'InternetSharing' },
      onClick: () => {
        setDataType('http');
      },
    },
    {
      key: 'git',
      text: 'From github public repo',
      iconProps: { iconName: 'GitGraph' },
      onClick: () => {
        setDataType('git');
      },
    },
    {
      key: 'hdfs',
      text: 'From PAI HDFS',
      iconProps: { iconName: 'Cloudy' },
      className: config.launcherType === 'k8s' ? c(t.dn) : null,
      onClick: () => {
        setDataType('hdfs');
      },
    },
  ];

  return (
    <div>
      <PrimaryButton
        iconProps={{ iconName: 'Add' }}
        text='Add data source'
        menuProps={{ items: menuItems }}
      />
      <div className={c(t.mb1)}>
        {dataType === 'local' && (
          <HdfsContext.Consumer>
            {value => (
              <AddLocal
                dataList={dataList}
                setDataList={setDataList}
                setDataType={setDataType}
                hdfsClient={value.hdfsClient}
              />
            )}
          </HdfsContext.Consumer>
        )}
        {dataType === 'http' && (
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
        )}
        {dataType === 'hdfs' && (
          <HdfsContext.Consumer>
            {value => (
              <AddHDFS
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

AddDataSource.propTypes = {
  dataList: PropTypes.arrayOf(PropTypes.instanceOf(InputData)),
  setDataList: PropTypes.func,
};
