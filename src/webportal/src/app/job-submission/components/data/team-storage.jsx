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

import React, {useEffect, useState} from 'react';
import {Stack, DefaultPalette} from 'office-ui-fabric-react';
import {DefaultButton} from 'office-ui-fabric-react/lib/Button';
import {FontClassNames, FontWeights} from '@uifabric/styling';
import c from 'classnames';
import PropTypes from 'prop-types';
import {cloneDeep} from 'lodash';

import {MountDirectories} from '../../models/data/mount-directories';
import {TeamMountList} from './team-mount-list';
import t from '../../../../app/components/tachyons.scss';

export const TeamStorage = ({
  teamConfigs,
  defaultTeamConfigs,
  mountDirs,
  onMountDirChange,
  jobName,
}) => {
  const [selectedConfigNames, setSelectedConfigNames] = useState(() => {
    return defaultTeamConfigs.map((element) => {
      return element.name;
    });
  });

  useEffect(() => {
    let selectedConfigs = [];
    if (selectedConfigNames.length > 0) {
      selectedConfigs = teamConfigs.filter((element) => {
        return selectedConfigNames.includes(element.name);
      });
    }
    const newMountDirs = cloneDeep(mountDirs);
    newMountDirs.selectedConfigs = selectedConfigs;
    onMountDirChange(newMountDirs);
  }, [selectedConfigNames]);

  const showConfigs = (config) => {
    return (
      <DefaultButton
        key={config.name}
        text={config.name}
        toggle={true}
        checked={
          selectedConfigNames.length > 0 &&
          selectedConfigNames.includes(config.name)
        }
        onClick={() => {
          console.log(selectedConfigNames);
          let newSelectedConfigNames = [];
          if (selectedConfigNames.length == 0) {
            newSelectedConfigNames = [config.name];
          } else if (
            selectedConfigNames.length > 0 &&
            selectedConfigNames.includes(config.name)
          ) {
            const idx = selectedConfigNames.indexOf(config.name);
            newSelectedConfigNames = [
              ...selectedConfigNames.slice(0, idx),
              ...selectedConfigNames.slice(idx + 1),
            ];
          } else {
            newSelectedConfigNames = cloneDeep(selectedConfigNames);
            newSelectedConfigNames.push(config.name);
          }
          console.log(newSelectedConfigNames);
          setSelectedConfigNames(newSelectedConfigNames);
        }}
      />
    );
  };

  const showConfigSets = () => {
    if (teamConfigs.length === 0) {
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
            {teamConfigs.map((config) => showConfigs(config))}
          </Stack>
          <TeamMountList
            dataList={mountDirs == null ? [] : mountDirs.getTeamDataList()}
            setDataList={null}
          />
        </div>
      );
    }
  };

  return <div>{showConfigSets()}</div>;
};

TeamStorage.propTypes = {
  teamConfigs: PropTypes.array,
  defaultTeamConfigs: PropTypes.array,
  mountDirs: PropTypes.instanceOf(MountDirectories),
  onMountDirChange: PropTypes.func,
  jobName: PropTypes.string,
};
