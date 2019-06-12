import React from 'react'
import c from 'classnames'
import { FontClassNames } from '@uifabric/styling'
import {
  DetailsList,
  IColumn,
  SelectionMode,
} from 'office-ui-fabric-react/lib/DetailsList'
import { PrimaryButton } from 'office-ui-fabric-react/lib/Button'
import { cloneDeep } from 'lodash'

import { MountItem } from '../../util/constants'
import t from '../../tachyons.css'

export const MountList = ({ mountList, setMountList }: Props): JSX.Element => {
  const columes = [
    {
      key: 'mountPath',
      name: 'Mount path inside container',
      headerClassName: FontClassNames.medium,
      minWidth: 50,
      maxWidth: 200,
      onRender: (item) => {
        return <div className={FontClassNames.medium}>{item.mountPath}</div>
      },
    },
    {
      key: 'dataSource',
      name: 'Data Source',
      headerClassName: FontClassNames.medium,
      minWidth: 50,
      maxWidth: 400,
      onRender: (item: MountItem) => {
        return (
          <div className={FontClassNames.medium}>{`${item.dataSource} ( ${
            item.sourceType
          } )`}</div>
        )
      },
    },
    {
      key: 'actions',
      name: 'Actions',
      headerClassName: FontClassNames.medium,
      minWidth: 50,
      onRender: (_item: MountItem, index: number | undefined) => {
        return (
          <div className={c(t.flex)}>
            <PrimaryButton
              text='Delete'
              onClick={() => {
                const newMountList = cloneDeep(mountList)
                if (index !== undefined) {
                  newMountList.splice(index, 1)
                }
                setMountList(newMountList)
              }}
            />
          </div>
        )
      },
    },
  ]

  return (
    <div className={c(t.mb2)}>
      <DetailsList
        columns={columes}
        disableSelectionZone
        selectionMode={SelectionMode.none}
        items={mountList}
      />
    </div>
  )
}
