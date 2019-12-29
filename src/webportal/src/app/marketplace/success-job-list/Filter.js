import { isNil } from 'lodash';

class Filter {
  constructor(keyword = '') {
    this.keyword = keyword;
  }

  apply(itemList) {
    const { keyword } = this;
    if (isNil(itemList)) {
      return null;
    }
    if (keyword.length === 0) {
      return itemList;
    }
    const items = itemList.filter(item => item.name.indexOf(keyword) > -1);
    return items;
  }
}

export default Filter;
