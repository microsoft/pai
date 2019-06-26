/* !
 * Copyright (c) Microsoft Corporation
 * All rights reserved.
 *
 * MIT License
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Stack} from 'office-ui-fabric-react';
import {DefaultButton} from 'office-ui-fabric-react/lib/Button';
import {FontClassNames, FontWeights} from '@uifabric/styling';
import c from 'classnames';
import PropTypes from 'prop-types';
import MountDirectories from '../../models/data/mount-directories';
import {TeamMountList} from './team-mount-list';
import t from '../../../../app/components/tachyons.scss';
import config from '../../../config/webportal.config';

export const TeamStorage = (props) => {
  const {onChange, jobName} = props;

  const responseToData = (response) => {
    if (response.ok) {
      return response.json().then((responseData) => responseData.data);
    } else {
      throw Error(`HTTP ${response.status}`);
    }
  };

  const api = config.restServerUri;
  const user = cookies.get('user');
  const token = cookies.get('token');

  const [userGroups, setUserGroups] = useState([]);
  const [serverNames, setServerNames] = useState([]);
  const [configs, setConfigs] = useState([]);
  const [selectedConfigs, setSelectedConfigs] = useState([]);

  useEffect(() => {
    console.log('get user');
    const userInfoUrl = `${api}/api/v2/user/${user}`;
    fetch(userInfoUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }).then((response) => {
      if (response.ok) {
        response
          .json()
          .then((responseData) => responseData.grouplist)
          .then((groupList) => {
            setUserGroups(groupList);
          });
      } else {
        setUserGroups(['paigroup']);
        throw Error(`HTTP ${response.status}`);
      }
    });
  }, []);

  useEffect(() => {
    console.log('set config');
    if (userGroups.length === 0) {
      return;
    }

    const storageConfigUrl = `${api}/api/v1/kubernetes/api/v1/namespaces/pai-storage/secrets/storage-config`;
    fetch(storageConfigUrl)
      .then(responseToData)
      .then((storageConfigData) => {
        const newConfigs = [];
        for (const confName of Object.keys(storageConfigData)) {
          try {
            const config = JSON.parse(atob(storageConfigData[confName]));
            for (const gpn of userGroups) {
              if (config.gpn !== gpn) {
                continue;
              } else {
                const selectedConfig = selectedConfigs.find(
                  (conf) => conf.name === config.name,
                );
                if (selectedConfig === undefined) {
                  newConfigs.push(config);
                } else {
                  newConfigs.push(selectedConfig);
                }

                if (config.servers !== undefined) {
                  for (const serverName of config.servers) {
                    if (serverNames.indexOf(serverName) === -1) {
                      serverNames.push(serverName);
                    }
                  }
                }
                // Auto select default mounted configs
                if (
                  /* defaultValue === null && */ config.default === true &&
                  selectedConfigs.find((conf) => conf.name === config.name) ===
                    undefined
                ) {
                  selectedConfigs.push(config);
                }
              }
            }
          } catch (e) {
            // ignored
          }
        }

        setConfigs(newConfigs);
        setSelectedConfigs(selectedConfigs.concat());
        setServerNames(serverNames.concat());
      });
  }, [userGroups]);

  const [servers, setServers] = useState([]);
  useEffect(() => {
    // Get Server info
    const storageServerUrl = `${api}/api/v1/kubernetes/api/v1/namespaces/pai-storage/secrets/storage-server`;
    try {
      fetch(storageServerUrl)
        .then(responseToData)
        .then((storageServerData) => {
          for (const serverName of serverNames) {
            if (serverName in storageServerData) {
              const serverContent = JSON.parse(
                atob(storageServerData[serverName]),
              );
              if (
                servers.find((item) => item.spn === serverContent.spn) ===
                undefined
              ) {
                servers.push(serverContent);
              }
            }
          }
          setServers(servers.concat());
        });
    } catch (e) {
      // Do nothing
    }
  }, [serverNames]);

  const onSCChange = useCallback((config, value) => {
    if (value) {
      if (
        selectedConfigs.find((item) => item.name === config.name) === undefined
      ) {
        selectedConfigs.push(config);
      }
    } else {
      const oriConfigIndex = selectedConfigs.find(
        (item) => item.name === config.name,
      );
      if (oriConfigIndex !== undefined) {
        selectedConfigs.splice(selectedConfigs.indexOf(oriConfigIndex), 1);
      }
    }
    setSelectedConfigs(selectedConfigs.concat());
  }, []);

  const mountDirectories = useMemo(() => {
    return new MountDirectories(user, jobName, selectedConfigs, servers);
  }, [user, jobName, selectedConfigs, servers]);

  useEffect(() => {
    if (mountDirectories !== null) {
      onChange(mountDirectories);
    }
  }, [mountDirectories]);

  const showConfigs = (config, index) => {
    return (
      <DefaultButton
        key={config.name}
        text={config.name}
        toggle={true}
        checked={
          selectedConfigs.find((sc) => sc.name === config.name) !== undefined
        }
        onClick={(event) => {
          let selected =
            selectedConfigs.find((sc) => sc.name === config.name) !== undefined;
          onSCChange(config, !selected);
        }}
      />
    );
  };

  const showConfigSets = () => {
    if (userGroups.length === 0 || configs.length === 0) {
      return null;
    } else {
      return (
        <div>
          <div
            className={c(FontClassNames.mediumPlus, t.pb2)}
            style={{fontWeight: FontWeights.semibold}}
          >
            Team Share Storage
          </div>
          <Stack horizontal disableShrink gap='s1'>
            {configs.map((config, index) => showConfigs(config, index))}
          </Stack>
          <TeamMountList
            dataList={
              mountDirectories == null ? [] : mountDirectories.getTeamDataList()
            }
            setDataList={null}
          />
        </div>
      );
    }
  };

  return (
    <div>
      {showConfigSets()}
    </div>
  );
};

TeamStorage.propTypes = {
  onChange: PropTypes.func,
  jobName: PropTypes.string,
};
