import { isNil } from 'lodash';

class Filter {
  constructor(
    keyword = '',
    authors = new Set(),
    custom = false,
    official = false,
  ) {
    this.keyword = keyword;
    this.authors = authors;
    this.custom = custom;
    this.official = official;
  }

  apply(itemList) {
    const { keyword, authors, custom, official } = this;
    // before useEffect to load data.
    if (isNil(itemList)) {
      return null;
    }
    // initial state
    if (
      keyword.length === 0 &&
      authors.size === 0 &&
      custom === false &&
      official === false
    ) {
      return itemList;
    }
    // states changed
    const items = itemList.filter(
      item =>
        item.name.indexOf(keyword) > -1 &&
        (authors.size === 0 || authors.has(item.author)),
    );
    if (custom === official) {
      return items;
    } else {
      return items.filter(
        item =>
          (custom && item.category === 'custom') ||
          (official && item.category === 'official'),
      );
    }
  }
}

export default Filter;
