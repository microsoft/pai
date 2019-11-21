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

import React, { useEffect, useLayoutEffect, useState } from 'react';

import {
  Checkbox,
  DefaultButton,
  DetailsList,
  SelectionMode,
  Stack,
  FontClassNames,
  FontWeights,
  getTheme,
  DetailsListLayoutMode,
  Text,
} from 'office-ui-fabric-react';
import { TooltipIcon } from '../controls/tooltip-icon';

import c from 'classnames';
import PropTypes from 'prop-types';
import { cloneDeep } from 'lodash';

import { MountDirectories } from '../../models/data/mount-directories';
import { dispatchResizeEvent } from '../../utils/utils';
import t from '../../../components/tachyons.scss';
import { PROTOCOL_TOOLTIPS } from '../../utils/constants';
import TeamDetail from './team-detail';

const { spacing } = getTheme();

export const TeamStorage = ({
  teamConfigs,
  defaultTeamConfigs,
  mountDirs,
  onMountDirChange,
}) => {
  // workaround for fabric's bug
  // https://github.com/OfficeDev/office-ui-fabric-react/issues/5280#issuecomment-489619108
  useLayoutEffect(() => {
    dispatchResizeEvent();
  });

  const [selectedConfigNames, setSelectedConfigNames] = useState(() => {
    return mountDirs.selectedConfigs.map(element => {
      return element.name;
    });
  });

  useEffect(() => {
    const names = defaultTeamConfigs.map(element => {
      return element.name;
    });
    setSelectedConfigNames(names);
  }, [defaultTeamConfigs]);

  const [teamDetail, setTeamDetail] = useState({ isOpen: false });
  const openTeamDetail = config => {
    setTeamDetail({ isOpen: true, config: config, servers: mountDirs.servers });
  };
  const hideTeamDetail = () => {
    setTeamDetail({ isOpen: false });
  };

  useEffect(() => {
    let selectedConfigs = [];
    if (selectedConfigNames.length > 0) {
      selectedConfigs = teamConfigs.filter(element => {
        return selectedConfigNames.includes(element.name);
      });
    }
    const newMountDirs = cloneDeep(mountDirs);
    newMountDirs.selectedConfigs = selectedConfigs;
    onMountDirChange(newMountDirs);
  }, [selectedConfigNames]);

  const columes = [
    {
      key: 'name',
      name: 'Name',
      headerClassName: FontClassNames.medium,
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
            onChange={(ev, isChecked) => {
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
      headerClassName: FontClassNames.medium,
      minWidth: 120,
      onRender: item => {
        return (
          <div className={FontClassNames.medium}>
            {item.mountInfos.map((mountInfo, infoId) => {
              return <div key={item.name + infoId}>{mountInfo.mountPoint}</div>;
            })}
          </div>
        );
      },
    },
    {
      key: 'permission',
      name: 'Permission',
      headerClassName: FontClassNames.medium,
      minWidth: 50,
      onRender: item => {
        return (
          <div className={FontClassNames.medium}>
            {item.mountInfos.map((mountInfo, infoId) => {
              return <div key={item.name + 'per' + infoId}>RW</div>;
            })}
          </div>
        );
      },
    },
    {
      key: 'detail',
      name: 'Detail',
      headerClassName: FontClassNames.medium,
      minWidth: 70,
      onRender: item => {
        /**
         * @param {React.MouseEvent} event
         */
        function onClick(event) {
          openTeamDetail(item);
        }

        return (
          <div>
            <DefaultButton text='Detail' onClick={onClick} />
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <Stack horizontal gap='s1'>
        <Text
          styles={{
            fontWeight: FontWeights.semibold,
            paddingBottom: spacing.m,
          }}
        >
          Team Share Storage
        </Text>
        <TooltipIcon content={PROTOCOL_TOOLTIPS.teamStorage} />
      </Stack>

      <div className={c(t.mb2)}>
        <DetailsList
          columns={columes}
          disableSelectionZone
          selectionMode={SelectionMode.none}
          items={teamConfigs}
          layoutMode={DetailsListLayoutMode.fixedColumns}
          compact
        />
      </div>
      {/* <TeamMountList
        dataList={mountDirs ? mountDirs.getTeamDataList() : []}
      /> */}
      {teamDetail.isOpen && (
        <TeamDetail
          isOpen={teamDetail.isOpen}
          config={teamDetail.config}
          servers={teamDetail.servers}
          hide={hideTeamDetail}
        />
      )}
    </div>
  );
};

TeamStorage.propTypes = {
  teamConfigs: PropTypes.array,
  defaultTeamConfigs: PropTypes.array,
  mountDirs: PropTypes.instanceOf(MountDirectories),
  onMountDirChange: PropTypes.func,
};
