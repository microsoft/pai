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

import React, { useEffect, useState } from 'react'
import {
  Stack,
  Checkbox,
  FontClassNames,
  FontWeights,
  getTheme,
} from 'office-ui-fabric-react'
import c from 'classnames'
import PropTypes from 'prop-types'
import { cloneDeep } from 'lodash'

import { MountDirectories } from '../../models/data/mount-directories'
import { TeamMountList } from './team-mount-list'

const { spacing } = getTheme()

export const TeamStorage = ({
  teamConfigs,
  defaultTeamConfigs,
  mountDirs,
  onMountDirChange,
}) => {
  const [selectedConfigNames, setSelectedConfigNames] = useState(() => {
    return mountDirs.selectedConfigs.map(element => {
      return element.name
    })
  })

  useEffect(() => {
    let selectedConfigs = []
    if (selectedConfigNames.length > 0) {
      selectedConfigs = teamConfigs.filter(element => {
        return selectedConfigNames.includes(element.name)
      })
    }
    const newMountDirs = cloneDeep(mountDirs)
    newMountDirs.selectedConfigs = selectedConfigs
    onMountDirChange(newMountDirs)
  }, [selectedConfigNames])

  const showConfigs = config => {
    return (
      <Checkbox
        key={config.name}
        label={config.name}
        defaultChecked={
          selectedConfigNames.length > 0 &&
          selectedConfigNames.includes(config.name)
        }
        onChange={(ev, isChecked) => {
          let newSelectedConfigNames = []
          if (!isChecked && selectedConfigNames.includes(config.name)) {
            const idx = selectedConfigNames.indexOf(config.name)
            newSelectedConfigNames = [
              ...selectedConfigNames.slice(0, idx),
              ...selectedConfigNames.slice(idx + 1),
            ]
          } else if (isChecked && !selectedConfigNames.includes(config.name)) {
            newSelectedConfigNames = cloneDeep(selectedConfigNames)
            newSelectedConfigNames.push(config.name)
          }
          setSelectedConfigNames(newSelectedConfigNames)
        }}
      />
    )
  }

  const showConfigSets = () => {
    if (teamConfigs.length === 0) {
      return null
    }
    return (
      <div>
        <div
          className={c(FontClassNames.mediumPlus)}
          style={{ fontWeight: FontWeights.semibold, paddingBottom: spacing.m }}
        >
          Team Share Storage
        </div>
        <Stack horizontal disableShrink gap='s1' wrap='true'>
          {teamConfigs.map(config => showConfigs(config))}
        </Stack>
        <TeamMountList
          dataList={mountDirs ? mountDirs.getTeamDataList() : []}
        />
      </div>
    )
  }

  return <div>{showConfigSets()}</div>
}

TeamStorage.propTypes = {
  teamConfigs: PropTypes.array,
  defaultTeamConfigs: PropTypes.array,
  mountDirs: PropTypes.instanceOf(MountDirectories),
  onMountDirChange: PropTypes.func,
}
