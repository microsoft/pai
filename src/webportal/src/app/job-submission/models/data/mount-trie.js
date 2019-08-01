export class TrieNode {
  constructor(fullpath, label, subpaths = undefined) {
    this.fullpath = fullpath;
    this.label = label;
    this.subpaths = subpaths;
  }
}

export class MountPathTrie {
  constructor(rootLabel) {
    this.root = new TrieNode(rootLabel, rootLabel);
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
    queryIndex += 1;
    while (pivot.subpaths && queryIndex < query.length) {
      const prefixValue = query[queryIndex];
      const matchedNode = pivot.subpaths.filter(node => {
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
        const newNode = new TrieNode(
          query.slice(0, queryIndex + 1).join(''),
          query[queryIndex],
        );
        pivot.subpaths.push(newNode);
        pivot = newNode;
      } else {
        pivot.subpaths = [
          new TrieNode(
            query.slice(0, queryIndex + 1).join(''),
            query[queryIndex],
          ),
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
