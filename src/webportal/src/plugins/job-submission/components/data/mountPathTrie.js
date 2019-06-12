export interface TrieNode {
  fullpath: string
  label: string
  subpaths?: TrieNode[]
}

export class MountPathTrie {
  private root: TrieNode

  public get rootNode(): TrieNode {
    return this.root
  }

  public set rootNode(newRoot: TrieNode) {
    this.root = newRoot
  }

  public constructor(rootLabel: string) {
    this.root = { fullpath: rootLabel, label: rootLabel, subpaths: undefined }
  }

  public insertNode(query: string[]): boolean {
    let pivot = this.root
    let queryIndex = 0
    if (pivot.label !== query[queryIndex]) {
      alert(`path does not start with ${this.root.label}!`)
    }
    queryIndex += 1
    while (pivot.subpaths && queryIndex < query.length) {
      const prefixValue = query[queryIndex]
      const matchedNode = pivot.subpaths.filter(node => {
        return node.label === prefixValue
      })
      if (matchedNode.length === 0) {
        break
      }
      ;[pivot] = matchedNode // https://github.com/prettier/prettier/issues/736#issuecomment-291934981
      queryIndex += 1
    }
    if (queryIndex === query.length) {
      return false
    }
    while (queryIndex < query.length) {
      if (pivot.subpaths) {
        const newNode = {
          fullpath: query.slice(0, queryIndex + 1).join(''),
          label: query[queryIndex],
          subpaths: undefined,
        }
        pivot.subpaths.push(newNode)
        pivot = newNode
      } else {
        pivot.subpaths = [
          {
            fullpath: query.slice(0, queryIndex + 1).join(''),
            label: query[queryIndex],
            subpaths: undefined,
          },
        ]
        ;[pivot] = pivot.subpaths
      }
      queryIndex += 1
    }

    return true
  }

  public printTree(): TrieNode {
    return this.root
  }
}
