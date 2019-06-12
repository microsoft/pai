import React, { useState } from 'react'
import c from 'classnames'
import { PrimaryButton } from 'office-ui-fabric-react/lib/Button'

import { AddHttp } from './addHttp'
import { AddLocal } from './addLocal'
import { AddGit } from './addGit'
import { AddHDFS } from './addHDFS'
import { MountItem } from '../../util/constants'
import { Context } from '../../util/context'
import s from '../../spacing.scss'

interface Props {
  mountList: MountItem[]
  setMountList: (mountList: MountItem[]) => void
}

export const AddDataSource = ({
  mountList,
  setMountList,
}: Props): JSX.Element => {
  const [mountType, setMountType] = useState()

  const menuItems = [
    {
      key: 'local',
      text: 'From local ( size<1G )',
      iconProps: { iconName: 'Documentation' },
      onClick: () => {
        setMountType('local')
      },
    },
    {
      key: 'http',
      text: 'From http/https source',
      iconProps: { iconName: 'InternetSharing' },
      onClick: () => {
        setMountType('http')
      },
    },
    {
      key: 'git',
      text: 'From github public repo',
      iconProps: { iconName: 'GitGraph' },
      onClick: () => {
        setMountType('git')
      },
    },
    {
      key: 'hdfs',
      text: 'From PAI HDFS',
      iconProps: { iconName: 'Cloudy' },
      onClick: () => {
        setMountType('hdfs')
      },
    },
  ]

  return (
    <div>
      <PrimaryButton
        iconProps={{ iconName: 'Add' }}
        text='Add Data Source'
        menuProps={{ items: menuItems }}
      />
      <div className={c(s.mb2)}>
        {mountType === 'local' && (
          <AddLocal
            mountList={mountList}
            setMountList={setMountList}
            setMountType={setMountType}
          />
        )}
        {mountType === 'http' && (
          <AddHttp
            mountList={mountList}
            setMountList={setMountList}
            setMountType={setMountType}
          />
        )}
        {mountType === 'git' && (
          <AddGit
            mountList={mountList}
            setMountList={setMountList}
            setMountType={setMountType}
          />
        )}
        {mountType === 'hdfs' && (
          <Context.Consumer>
            {value => (
              <AddHDFS
                mountList={mountList}
                setMountList={setMountList}
                setMountType={setMountType}
                hdfsClient={value.hdfsClient}
                hdfsPathPrefix='/'
              />
            )}
          </Context.Consumer>
        )}
      </div>
    </div>
  )
}
