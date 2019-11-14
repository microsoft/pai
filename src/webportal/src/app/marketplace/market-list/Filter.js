import { isNil } from 'lodash';

class Filter {
  constructor(
    keyword = '',
    authors = new Set(),
    custom = true,
    official = true,
  ) {
    this.keyword = keyword;
    this.authors = authors;
    this.custom = custom;
    this.official = official;
  }

  apply(itemList) {
    const { keyword, authors, custom, official } = this;
    if (isNil(itemList)) {
      return null;
    }
    if (custom === false && official === false) {
      return itemList;
    } else {
      return itemList.filter(
        item =>
          item.name.indexOf(keyword) > -1 &&
          (authors.size === 0 || authors.has(item.author)) &&
          ((custom && item.category === 'custom') ||
            (official && item.category === 'official')),
      );
    }
  }
}

export default Filter;
