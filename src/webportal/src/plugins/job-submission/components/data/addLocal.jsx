import React, { useState } from 'react'
import c from 'classnames'
import { PrimaryButton } from 'office-ui-fabric-react/lib/Button'
import { TextField } from 'office-ui-fabric-react/lib/TextField'
import { cloneDeep } from 'lodash'
import { FontClassNames } from '@uifabric/styling'
import { Icon } from 'office-ui-fabric-react/lib/Icon'
import { Dropdown } from 'office-ui-fabric-react/lib/Dropdown'

import { STORAGE_PREFIX, MountItem } from '../../util/constants'
import t from '../../tachyons.css'
import s from '../../spacing.scss'

interface Props {
  mountList: MountItem[]
  setMountList: (mountList: MountItem[]) => void
  setMountType: (mountType: string) => void
}

export const AddLocal = ({
  mountList,
  setMountList,
  setMountType,
}: Props): JSX.Element => {
  const [mountPath, setMountPath] = useState()
  const [files, setFiles] = useState()
  const [uploadType, setUploadType] = useState('Files')
  const submitMount = (): void => {
    const newMountList = cloneDeep(mountList)
    const dataSource = files.map((file: any) => file.name).join(', ') // eslint-disable-line @typescript-eslint/no-explicit-any
    const uploadFiles = files
    newMountList.push({
      mountPath,
      dataSource,
      sourceType: 'local',
      uploadFiles,
    })
    newMountList.sort((a, b) => {
      if (a.mountPath < b.mountPath) {
        return -1
      }
      if (a.mountPath > b.mountPath) {
        return 1
      }
      return 0
    })
    setMountList(newMountList)
    setMountType('none')
  }
  return (
    <div>
      <div className={c(t.flex, t.itemsEnd, t.justifyBetween)}>
        <TextField
          required
          prefix={STORAGE_PREFIX}
          label='The path in container'
          onChange={(_event, newValue) => {
            setMountPath(`${STORAGE_PREFIX}${newValue}`)
          }}
          className={c(s.w20)}
        />
        <label
          htmlFor='upload'
          className={c(
            FontClassNames.medium,
            t.flex,
            t.itemsCenter,
            s.w20,
            s.h2,
            t.bgLightGray,
          )}
        >
          {uploadType === 'Files' && (
            <input
              id='upload'
              type='file'
              onChange={event => {
                const fileList = []
                if (event.target.files !== null) {
                  for (let i = 0; i < event.target.files.length; i += 1) {
                    fileList.push(event.target.files[i])
                  }
                }
                setFiles(fileList)
              }}
              style={{ display: 'none' }}
              multiple
            />
          )}
          {uploadType === 'Folder' && (
            // @ts-ignore
            <input
              id='upload'
              type='file'
              onChange={event => {
                const fileList = []
                if (event.target.files !== null) {
                  for (let i = 0; i < event.target.files.length; i += 1) {
                    fileList.push(event.target.files[i])
                  }
                }
                setFiles(fileList)
              }}
              style={{ display: 'none' }}
              webkitdirectory=''
              multiple
            />
          )}
          <Icon iconName='Upload' className={c(s.mh2, s.pt1)} />
          <div className={c(s.w4)}>
            {files === undefined && `Upload ${uploadType}`}
            {files !== undefined && files.length === 1 && files[0].name}
            {files !== undefined && files.length > 1 && `${files.length} Files`}
          </div>
        </label>
        <Dropdown
          placeholder='Files'
          options={[
            {
              key: 'files',
              text: 'Files',
              title: 'select files to upload',
            },
            { key: 'folder', text: 'Folder', title: 'select folder to upload' },
          ]}
          className={c(s.w4, s.mr4)}
          onChange={(_event, item) => {
            if (item !== undefined) {
              setUploadType(item.text)
            }
          }}
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
