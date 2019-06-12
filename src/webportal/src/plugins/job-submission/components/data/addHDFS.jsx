import React, { useState, useEffect } from 'react'
import c from 'classnames'
import { PrimaryButton } from 'office-ui-fabric-react/lib/Button'
import { TextField } from 'office-ui-fabric-react/lib/TextField'
import { cloneDeep } from 'lodash'
import { TagPicker, ITag } from 'office-ui-fabric-react/lib/Pickers'
import { FontClassNames } from '@uifabric/styling'

import { WebHDFSClient } from '../../util/webhdfs'
import { STORAGE_PREFIX, MountItem } from '../../util/constants'
import { validateMountPath, validateHDFSPath } from '../../util/validation'
import t from '../../tachyons.css'
import s from '../../spacing.scss'

interface Props {
  mountList: MountItem[]
  setMountList: (mountList: MountItem[]) => void
  setMountType: (mountType: string) => void
  hdfsClient?: WebHDFSClient
  hdfsPathPrefix: string
}

export const AddHDFS = ({
  mountList,
  setMountList,
  setMountType,
  hdfsClient,
  hdfsPathPrefix,
}: Props): JSX.Element => {
  const [mountPath, setMountPath] = useState()
  const [isHdfsEnabled, setIsHdfsEnabled] = useState(true)
  const [hdfsPath, setHdfsPath] = useState()
  useEffect(() => {
    if (!hdfsClient) {
      setIsHdfsEnabled(false)
    } else {
      hdfsClient.checkAccess().then(isAccessiable => {
        setIsHdfsEnabled(isAccessiable)
      })
    }
  }, [])
  const submitMount = async (): Promise<void> => {
    if (!mountPath) {
      alert('please input the path in container')

      return
    }
    const valid = validateMountPath(mountPath)
    if (!valid.isLegal) {
      alert(valid.illegalMessage)

      return
    }
    if (!hdfsPath) {
      alert('please input the path in PAI HDFS')

      return
    }
    if (hdfsClient) {
      try {
        await hdfsClient.readDir(hdfsPath)
      } catch (e) {
        alert(`${hdfsPath}: ${e.message}`)

        return
      }
    } else {
      const validHDFS = validateHDFSPath(hdfsPath)
      if (!validHDFS.isLegal) {
        alert(valid.illegalMessage)

        return
      }
    }
    const newMountList = cloneDeep(mountList)
    newMountList.push({ mountPath, dataSource: hdfsPath, sourceType: 'hdfs' })
    setMountList(newMountList)
    setMountType('none')
  }
  const onFilterChanged = async (filterText: string): Promise<ITag[]> => {
    if (!isHdfsEnabled || !hdfsClient) {
      return []
    }
    let result: string[]
    try {
      const pathPrefix = filterText.slice(0, filterText.lastIndexOf('/') + 1)
      result = await hdfsClient.readDir(`${hdfsPathPrefix}${pathPrefix}`)
      const resultTags = result
        .filter(path => {
          if (filterText.lastIndexOf('/') === filterText.length - 1) {
            return true
          }
          const partPath = filterText.split('/').pop()
          if (!partPath) {
            return []
          }
          return path.includes(partPath)
        })
        .map(pathSuffix => {
          return {
            name: pathSuffix,
            key: `${pathPrefix}${pathSuffix}`,
          }
        })
      return resultTags
    } catch (e) {
      return []
    }
  }
  const onItemSelected = (selectedItem: ITag | undefined): ITag | null => {
    if (!selectedItem) {
      return null
    }
    setHdfsPath(selectedItem.key)
    return {
      name: selectedItem.key,
      key: selectedItem.key,
    }
  }
  return (
    <div>
      <div className={c(t.flex, t.itemsEnd, t.justifyBetween)}>
        <TextField
          required={true} // eslint-disable-line react/jsx-boolean-value
          prefix={STORAGE_PREFIX}
          label='The path in container'
          className={c(s.w5, s.mr3)}
          onChange={(_event, newValue) => {
            setMountPath(`${STORAGE_PREFIX}${newValue}`)
          }}
        />
        <div>
          <div className={c(t.flex, t.itemsCenter)}>
            <div className={c(FontClassNames.smallPlus)}>
              The path in PAI HDFS
            </div>
            <div className={c(t.red, s.mb2)}>*</div>
          </div>
          <TagPicker
            onResolveSuggestions={onFilterChanged}
            onItemSelected={onItemSelected}
            pickerSuggestionsProps={{
              suggestionsHeaderText: 'path in hdfs should start with /',
              noResultsFoundText: 'path not found',
            }}
            itemLimit={1}
          />
        </div>
        <PrimaryButton
          text='view'
          disabled={!isHdfsEnabled}
          onClick={() => {
            window.open('http://10.151.40.234:50070/explorer.html#/')
          }}
          className={c(s.mr2)}
        />
        <PrimaryButton
          text='submit'
          className={c(s.mr2)}
          onClick={submitMount}
        />
        <PrimaryButton
          text='cancel'
          onClick={() => {
            setMountType('none')
          }}
        />
      </div>
    </div>
  )
}
