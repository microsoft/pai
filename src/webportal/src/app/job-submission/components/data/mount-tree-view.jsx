import React, { useState, useEffect } from 'react';
import c from 'classnames';
import {
  IconButton,
  FontClassNames,
  FontWeights,
  Stack,
  getTheme,
  Label,
} from 'office-ui-fabric-react';
import PropTypes from 'prop-types';

import { TrieNode, MountPathTrie } from '../../models/data/mount-trie';
import {
  getProjectNameFromGit,
  getFileNameFromHttp,
  getFolderNameFromHDFS,
} from '../../utils/utils';
import { InputData } from '../../models/data/input-data';

const { spacing } = getTheme();

function convertToTree(dataList) {
  const mountTrie = new MountPathTrie('/');
  dataList.forEach(mountItem => {
    let mountPrefixArray = mountItem.mountPath.split('/');
    mountPrefixArray = mountPrefixArray.map(path => `/${path}`);
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
    label.forEach(l => {
      mountPrefixArray.push(l);
      mountTrie.insertNode(mountPrefixArray);
      mountPrefixArray.pop();
    });
  });
  return mountTrie.rootNode;
}

const TreeNode = ({ label, isVisible, subpaths }) => {
  const nodeType = subpaths ? 'folder' : 'file';
  const [childrenVisualState, setChildrenVisualState] = useState(isVisible);

  return (
    <div>
      {isVisible && (
        <div>
          <Stack horizontal gap='s2'>
            {nodeType === 'folder' && (
              <div>
                {childrenVisualState ? (
                  <div>
                    <IconButton
                      iconProps={{ iconName: 'ChevronDown' }}
                      onClick={() => setChildrenVisualState(false)}
                    />
                    <IconButton
                      iconProps={{ iconName: 'OpenFolderHorizontal' }}
                      onClick={() => setChildrenVisualState(false)}
                    />
                  </div>
                ) : (
                  <div>
                    <IconButton
                      iconProps={{ iconName: 'ChevronRight' }}
                      onClick={() => setChildrenVisualState(true)}
                    />
                    <IconButton
                      iconProps={{ iconName: 'FabricFolder' }}
                      onClick={() => setChildrenVisualState(true)}
                    />
                  </div>
                )}
              </div>
            )}
            {nodeType === 'file' && (
              <IconButton iconProps={{ iconName: 'FileCode' }} />
            )}
            <Label>{label}</Label>
          </Stack>
          <div style={{ marginLeft: spacing.l2 }}>
            {subpaths &&
              subpaths.map(item => {
                return (
                  <TreeNode
                    key={item.fullpath}
                    label={item.label}
                    isVisible={childrenVisualState}
                    subpaths={item.subpaths}
                  />
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};

export const MountTreeView = ({ dataList }) => {
  const [treeData, setTreeData] = useState(() => {
    const trie = new MountPathTrie('/');
    return trie.rootNode;
  });

  useEffect(() => {
    const treeObject = convertToTree(dataList);
    setTreeData(treeObject);
  }, [dataList]);

  return (
    <div>
      <div
        className={c(FontClassNames.mediumPlus)}
        style={{ fontWeight: FontWeights.semibold }}
      >
        Preview container paths
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
