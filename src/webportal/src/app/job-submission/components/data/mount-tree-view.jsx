import React, {useState, useEffect} from 'react';
import c from 'classnames';
import {FontClassNames, FontWeights} from '@uifabric/styling';
import {IconButton} from 'office-ui-fabric-react/lib/Button';
import PropTypes from 'prop-types';

import {TrieNode, MountPathTrie} from '../../models/data/mount-trie';
import {
  getProjectNameFromGit,
  getFileNameFromHttp,
  getFolderNameFromHDFS,
} from '../../utils/utils';

import {InputData} from '../../models/data/input-data';
import t from '../../../../app/components/tachyons.scss';

function convertToTree(dataList) {
  const mountTrie = new MountPathTrie('/');
  dataList.forEach((mountItem) => {
    let mountPrefixArray = mountItem.mountPath.split('/');
    mountPrefixArray = mountPrefixArray.map((path) => `/${path}`);
    let label;
    if (mountItem.sourceType === 'git') {
      label = [
        `${getProjectNameFromGit(mountItem.dataSource)} (${
          mountItem.sourceType
        })`,
      ];
    } else if (mountItem.sourceType === 'http') {
      label = [
        `${getFileNameFromHttp(mountItem.dataSource)} (${
          mountItem.sourceType
        })`,
      ];
    } else if (mountItem.sourceType === 'hdfs') {
      label = [
        `${getFolderNameFromHDFS(mountItem.dataSource)} (${
          mountItem.sourceType
        })`,
      ];
    } else {
      label = mountItem.dataSource.split(', ');
    }
    label.forEach((l) => {
      mountPrefixArray.push(l);
      mountTrie.insertNode(mountPrefixArray);
      mountPrefixArray.pop();
    });
  });
  return mountTrie.rootNode;
}

const TreeNode = ({label, isVisible, subpaths}) => {
  const nodeType = subpaths ? 'folder' : 'file';
  const [childrenVisualState, setChildrenVisualState] = useState(isVisible);

  return (
    <div>
      {isVisible && (
        <div>
          <div className={c(t.flex, t.itemsCenter, FontClassNames.medium)}>
            {nodeType === 'folder' && (
              <div>
                {childrenVisualState ? (
                  <div className={c(t.mr1)}>
                    <IconButton
                      iconProps={{iconName: 'ChevronDown'}}
                      onClick={() => setChildrenVisualState(false)}
                      className={c(t.w1, t.mr1)}
                    />
                    <IconButton
                      iconProps={{iconName: 'OpenFolderHorizontal'}}
                      onClick={() => setChildrenVisualState(false)}
                      className={c(t.w2)}
                    />
                  </div>
                ) : (
                  <div>
                    <IconButton
                      iconProps={{iconName: 'ChevronRight'}}
                      onClick={() => setChildrenVisualState(true)}
                      className={c(t.w1, t.mr1)}
                    />
                    <IconButton
                      iconProps={{iconName: 'FabricFolder'}}
                      onClick={() => setChildrenVisualState(true)}
                      className={c(t.w2)}
                    />
                  </div>
                )}
              </div>
            )}
            {nodeType === 'file' && (
              <IconButton
                iconProps={{iconName: 'FileCode'}}
                className={c(t.w2)}
              />
            )}
            {label}
          </div>
          <div className={c(t.ml3)}>
            {subpaths &&
              subpaths.map(
                (item) => {
                  return (
                    <TreeNode
                      key={item.fullpath}
                      label={item.label}
                      isVisible={childrenVisualState}
                      subpaths={item.subpaths}
                    />
                  );
                },
              )}
          </div>
        </div>
      )}
    </div>
  );
};

export const MountTreeView = ({dataList}) => {
  const [treeData, setTreeData] = useState(() => {
    const trie = new MountPathTrie('/');
    return trie.rootNode;
  });

  useEffect(() => {
    const treeObject = convertToTree(dataList);
    setTreeData(treeObject);
  }, [dataList]);

  return (
    <div className={c(t.mb3)}>
      <div className={c(t.flex, t.itemsCenter)}>
        <div className={c(FontClassNames.mediumPlus)} style={{fontWeight: FontWeights.semibold}}>Preview container paths</div>
      </div>
      <TreeNode label={treeData.label} isVisible subpaths={treeData.subpaths} />
    </div>
  );
};

TreeNode.propTypes = {
  label: PropTypes.string,
  isVisible: PropTypes.bool,
  subpaths: PropTypes.arrayOf(PropTypes.instanceOf(TrieNode)),
};
MountTreeView.propTypes = {
  dataList: PropTypes.arrayOf(PropTypes.instanceOf(InputData)),
};
