// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { cloneDeep, get, isEmpty } from 'lodash';
import { TeamDetail } from './team-detail';
import { Box, Flex, Text } from '../../elements';
import { TooltipIcon } from '../controls/tooltip-icon';
import { PROTOCOL_TOOLTIPS } from '../../utils/constants';
import {
  Checkbox,
  DefaultButton,
  DetailsList,
  DetailsListLayoutMode,
  SelectionMode,
} from 'office-ui-fabric-react';
import { listUserStorageConfigs, fetchStorageDetails } from '../../utils/conn';

const PureTeamStorage = ({ jobProtocol, onJobProtocolChange }) => {
  const [storageConfig] = useState(get(jobProtocol, 'extras.storages', []));
  const [teamStorageDetails, setTeamStorageDetails] = useState([]);
  const [selectedConfigNames, setSelectedConfigNames] = useState([]);
  const [teamDetail, setTeamDetail] = useState({ isOpen: false });

  useEffect(() => {
    const user = cookies.get('user');

    const initialize = async () => {
      try {
        const userConfigNames = await listUserStorageConfigs(user);
        const storageDetails = await fetchStorageDetails(userConfigNames);
        if (!isEmpty(storageConfig)) {
          const updatedSelectedStorages = storageConfig.map(({ name }) => name);
          const updatedStorageDetails = storageDetails.map(storage => {
            const updatedStorage = storage;
            delete updatedStorage.default;
            if (updatedSelectedStorages.includes(storage.name)) {
              for (const item of storageConfig) {
                if (
                  item.name === updatedStorage.name &&
                  !isEmpty(item.mountPath)
                ) {
                  updatedStorage.mountPath = item.mountPath;
                }
              }
              updatedStorage.default = true;
            }
            return updatedStorage;
          });
          setSelectedConfigNames(updatedSelectedStorages);
          setTeamStorageDetails(updatedStorageDetails);
        } else {
          const updatedSelectedStorages = storageDetails.reduce(
            (storages, current) => {
              if (current.default) storages.push(current.name);
              return storages;
            },
            [],
          );
          setSelectedConfigNames(updatedSelectedStorages);
          setTeamStorageDetails(storageDetails);
        }
      } catch {}
    };

    initialize();
  }, []);

  useEffect(() => {
    const updatedExtras = cloneDeep(jobProtocol.extras);
    const updatedStorages = selectedConfigNames.map(name => ({ name }));
    updatedExtras.storages = updatedStorages;
    onJobProtocolChange({ ...jobProtocol, extras: updatedExtras });
  }, [selectedConfigNames]);

  const openTeamDetail = config => {
    setTeamDetail({ isOpen: true, config: config });
  };

  const hideTeamDetail = () => {
    setTeamDetail({ isOpen: false });
  };

  const columns = [
    {
      key: 'name',
      name: 'Name',
      minWidth: 160,
      onRender: (item, idx) => {
        return (
          <Checkbox
            key={item.name}
            label={item.name}
            checked={
              selectedConfigNames.length > 0 &&
              selectedConfigNames.includes(item.name)
            }
            onChange={(_, isChecked) => {
              let newSelectedConfigNames = [];
              if (!isChecked && selectedConfigNames.includes(item.name)) {
                const idx = selectedConfigNames.indexOf(item.name);
                newSelectedConfigNames = [
                  ...selectedConfigNames.slice(0, idx),
                  ...selectedConfigNames.slice(idx + 1),
                ];
              } else if (
                isChecked &&
                !selectedConfigNames.includes(item.name)
              ) {
                newSelectedConfigNames = cloneDeep(selectedConfigNames);
                newSelectedConfigNames.push(item.name);
              }
              setSelectedConfigNames(newSelectedConfigNames);
            }}
          />
        );
      },
    },
    {
      key: 'containerPath',
      name: 'Path',
      minWidth: 120,
      onRender: item => {
        return (
          <Box fontSize='s2'>
            <div key={item.name}>
              {item.mountPath ? item.mountPath : `/mnt/${item.name}`}
            </div>
          </Box>
        );
      },
    },
    {
      key: 'permission',
      name: 'Permission',
      minWidth: 50,
      onRender: item => {
        return (
          <Box fontSize='s2'>
            <div key={item.name + 'per'}>{item.readOnly ? 'RO' : 'RW'}</div>
          </Box>
        );
      },
    },
    {
      key: 'detail',
      name: 'Detail',
      minWidth: 70,
      onRender: item => {
        return (
          <DefaultButton text='Detail' onClick={() => openTeamDetail(item)} />
        );
      },
    },
  ];

  return (
    <>
      <Flex alignItems='baseline'>
        <Text paddingBottom='m'>Team Share Storage</Text>
        <TooltipIcon content={PROTOCOL_TOOLTIPS.teamStorage} />
      </Flex>
      <Box>
        <DetailsList
          columns={columns}
          disableSelectionZone
          items={teamStorageDetails}
          layoutMode={DetailsListLayoutMode.fixedColumns}
          selectionMode={SelectionMode.none}
          compact
        />
      </Box>
      {teamDetail.isOpen && (
        <TeamDetail
          isOpen={teamDetail.isOpen}
          config={teamDetail.config}
          onDismiss={hideTeamDetail}
        />
      )}
    </>
  );
};

const mapStateToProps = state => ({
  jobProtocol: state.JobProtocol.jobProtocol,
});

const mapDispatchToProps = dispatch => ({
  onJobProtocolChange: jobProtocol =>
    dispatch({ type: 'SAVE_JOBPROTOCOL', payload: jobProtocol }),
});

export const TeamStorage = connect(
  mapStateToProps,
  mapDispatchToProps,
)(PureTeamStorage);

PureTeamStorage.propTypes = {
  jobProtocol: PropTypes.object,
  onJobProtocolChange: PropTypes.func,
};
