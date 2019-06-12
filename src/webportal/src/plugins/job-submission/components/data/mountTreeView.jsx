import React, { useState, useEffect } from 'react'
import c from 'classnames'
import { FontClassNames } from '@uifabric/styling'
import { IconButton } from 'office-ui-fabric-react/lib/Button'

import { TrieNode, MountPathTrie } from './mountPathTrie'
import { MountItem, STORAGE_PREFIX } from '../../util/constants'
import {
  getProjectNameFromGit,
  getFileNameFromHttp,
  getFolderNameFromHDFS,
} from '../../util/util'
import t from '../../tachyons.css'
import s from '../../spacing.scss'

interface NodeProps {
  label: string
  isVisible: boolean
  subpaths?: TrieNode[]
}

interface TreeProps {
  mountList: MountItem[]
}

function convertToTree(mountList: MountItem[]): TrieNode {
  const mountTrie = new MountPathTrie(STORAGE_PREFIX)
  mountList.forEach(mountItem => {
    let mountPrefixArray = mountItem.mountPath.split('/')
    mountPrefixArray = mountPrefixArray.map(path => `/${path}`)
    mountPrefixArray = mountPrefixArray.slice(1)
    let label: string[]
    if (mountItem.sourceType === 'git') {
      label = [
        `${getProjectNameFromGit(mountItem.dataSource)} (${
          mountItem.sourceType
        })`,
      ]
    } else if (mountItem.sourceType === 'http') {
      label = [
        `${getFileNameFromHttp(mountItem.dataSource)} (${
          mountItem.sourceType
        })`,
      ]
    } else if (mountItem.sourceType === 'hdfs') {
      label = [
        `${getFolderNameFromHDFS(mountItem.dataSource)} (${
          mountItem.sourceType
        })`,
      ]
    } else {
      label = mountItem.dataSource.split(', ')
    }
    label.forEach(l => {
      mountPrefixArray.push(l)
      mountTrie.insertNode(mountPrefixArray)
      mountPrefixArray.pop()
    })
  })
  return mountTrie.rootNode
}

const TreeNode = ({ label, isVisible, subpaths }: NodeProps): JSX.Element => {
  const nodeType = subpaths ? 'folder' : 'file'
  const [childrenVisualState, setChildrenVisualState] = useState(isVisible)

  return (
    <div>
      {isVisible && (
        <div>
          <div className={c(t.flex, t.itemsCenter, FontClassNames.medium)}>
            {nodeType === 'folder' && (
              <div>
                {childrenVisualState ? (
                  <div>
                    <IconButton
                      iconProps={{ iconName: 'ChevronDown' }}
                      onClick={() => setChildrenVisualState(false)}
                      className={c(s.w1)}
                    />
                    <IconButton
                      iconProps={{ iconName: 'OpenFolderHorizontal' }}
                      onClick={() => setChildrenVisualState(false)}
                      className={c(s.w2)}
                    />
                  </div>
                ) : (
                  <div>
                    <IconButton
                      iconProps={{ iconName: 'ChevronRight' }}
                      onClick={() => setChildrenVisualState(true)}
                      className={c(s.w1)}
                    />
                    <IconButton
                      iconProps={{ iconName: 'FabricFolder' }}
                      onClick={() => setChildrenVisualState(true)}
                      className={c(s.w2)}
                    />
                  </div>
                )}
              </div>
            )}
            {nodeType === 'file' && (
              <IconButton
                iconProps={{ iconName: 'FileCode' }}
                className={c(s.w2)}
              />
            )}
            {label}
          </div>
          <div className={c(s.ml3)}>
            {subpaths &&
              subpaths.map(
                (item: TrieNode): JSX.Element => {
                  return (
                    <TreeNode
                      key={item.fullpath}
                      label={item.label}
                      isVisible={childrenVisualState}
                      subpaths={item.subpaths}
                    />
                  )
                },
              )}
          </div>
        </div>
      )}
    </div>
  )
}

export const MountTreeView = ({ mountList }: TreeProps): JSX.Element => {
  const [treeData, setTreeData] = useState(() => {
    const trie = new MountPathTrie(STORAGE_PREFIX)
    return trie.rootNode
  })

  useEffect(() => {
    const treeObject = convertToTree(mountList)
    setTreeData(treeObject)
  }, [mountList])

  return (
    <div className={c(s.mb3)}>
      <div className={c(t.flex, t.itemsCenter)}>
        <div className={c(FontClassNames.xLarge)}>Preview Mounted Files</div>
      </div>
      <TreeNode label={treeData.label} isVisible subpaths={treeData.subpaths} />
    </div>
  )
}
