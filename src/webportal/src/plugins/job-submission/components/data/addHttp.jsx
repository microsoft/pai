import React, { useState } from 'react'
import c from 'classnames'
import { PrimaryButton } from 'office-ui-fabric-react/lib/Button'
import { TextField } from 'office-ui-fabric-react/lib/TextField'
import { cloneDeep } from 'lodash'

import { STORAGE_PREFIX, MountItem } from '../../util/constants'
import t from '../../tachyons.css'
import s from '../../spacing.scss'

interface Props {
  mountList: MountItem[]
  setMountList: (mountList: MountItem[]) => void
  setMountType: (mountType: string) => void
}

export const AddHttp = ({
  mountList,
  setMountList,
  setMountType,
}: Props): JSX.Element => {
  const [mountPath, setMountPath] = useState()
  const [httpUrl, setHttpUrl] = useState()
  const submitMount = (): void => {
    const newMountList = cloneDeep(mountList)
    newMountList.push({ mountPath, dataSource: httpUrl, sourceType: 'http' })
    setMountList(newMountList)
    setMountType('none')
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
        <TextField
          required={true} // eslint-disable-line react/jsx-boolean-value
          label='The http address'
          className={c(s.w5, s.mr3)}
          onChange={(_event, newValue) => {
            setHttpUrl(newValue)
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
