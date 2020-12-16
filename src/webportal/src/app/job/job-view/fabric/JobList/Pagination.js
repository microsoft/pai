
const LOCAL_STORAGE_KEY = 'jobs-pagination';
export default class Pagination {
  /**
   * @param {number} itemsPerPage
   * @param {number} pageIndex
   */
  constructor(
    itemsPerPage = 20,
    pageIndex = 0,
  ) {
    this.itemsPerPage = itemsPerPage;
    this.pageIndex = pageIndex;
  }

  save() {
    const content = JSON.stringify({
      itemsPerPage: Number(this.itemsPerPage),
      pageIndex: Number(this.pageIndex),
    });
    window.localStorage.setItem(LOCAL_STORAGE_KEY, content);
  }

  load() {
    try {
      const content = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      if (content) {
        const {itemsPerPage, pageIndex} = JSON.parse(content);
        return new Pagination(itemsPerPage, pageIndex);
      }else {
        return new Pagination();
      }
    } catch (e) {
      return new Pagination() && window.localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }
  
  /**
   * @param {any[]} items
   * @returns {any[]}
   */
  apply(items) {
    const {itemsPerPage, pageIndex} = this;
    const start = itemsPerPage * pageIndex;
    const end = itemsPerPage * (pageIndex + 1);
    return items.slice(start, end).map((item) => {
      item.key = `${item.appId}`;
      return item;
    });
  }
}
