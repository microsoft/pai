export class TrieNode {
  constructor(fullpath, label, subpaths=undefined) {
    this.fullpath = fullpath;
    this.label = label;
    this.subpaths = subpaths;
  }
}

export class MountPathTrie {
  constructor(rootLabel) {
    this.root = {fullpath: rootLabel, label: rootLabel, subpaths: undefined};
  }

  get rootNode() {
    return this.root;
  }

  set rootNode(newRoot) {
    this.root = newRoot;
  }

  insertNode(query) {
    let pivot = this.root;
    let queryIndex = 0;
    if (pivot.label !== query[queryIndex]) {
      alert(`path does not start with ${this.root.label}!`);
    }
    queryIndex += 1;
    while (pivot.subpaths && queryIndex < query.length) {
      const prefixValue = query[queryIndex];
      const matchedNode = pivot.subpaths.filter((node) => {
        return node.label === prefixValue;
      });
      if (matchedNode.length === 0) {
        break;
      }
      [pivot] = matchedNode; // https://github.com/prettier/prettier/issues/736#issuecomment-291934981
      queryIndex += 1;
    }
    if (queryIndex === query.length) {
      return false;
    }
    while (queryIndex < query.length) {
      if (pivot.subpaths) {
        const newNode = {
          fullpath: query.slice(0, queryIndex + 1).join(''),
          label: query[queryIndex],
          subpaths: undefined,
        };
        pivot.subpaths.push(newNode);
        pivot = newNode;
      } else {
        pivot.subpaths = [
          {
            fullpath: query.slice(0, queryIndex + 1).join(''),
            label: query[queryIndex],
            subpaths: undefined,
          },
        ];
        [pivot] = pivot.subpaths;
      }
      queryIndex += 1;
    }

    return true;
  }

  printTree() {
    return this.root;
  }
}
