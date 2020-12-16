
import cuid from 'cuid';
export default class TableProperty {
  /**
   * The constructor function of TableProperty
   * @param {*} tableClass The class name of the table
   * @param {*} columnHeaderArray The column informatin of table
   * @param {*} columnDataItemArray The data items of table
   * @param {*} filterKey The search reference of search box
   * @param {*} itemsPerPage The item number per page in the table
   * @param {*} pageIndex The page index of table
   * @param {*} orderKey The order column for whole table
   * @param {*} descending descend order
     */
  constructor(columnHeaderArray, columnDataItemArray, filterKey, orderKey, itemsPerPage = 20, pageIndex = 0, descending = false, stringAscending = true) {
    this.columnHeaderArray = columnHeaderArray;
    this.columnDataItemArray = columnDataItemArray;
    this.filterKey = filterKey;
    this.orderKey = orderKey;
    this.descending = descending;
    this.stringAscending = stringAscending;
    this.isShortTable = (columnDataItemArray.length <= itemsPerPage);
    this.itemsPerPage = this.isShortTable ? columnDataItemArray.length : itemsPerPage;
    this.pageIndex = pageIndex;
    this.tableClass = cuid();
  }
}