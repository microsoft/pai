import { getModified, getDuration, getStatusIndex } from './utils';

export default class Ordering {
  /**
   * @param { string } field
   * @param { boolean | undefined } descending
   * @param { boolean | undefined } stringAscending If stringAscending is true, 
   *                                                the string type field will always in ascend order than number type field
   */
  constructor(field, descending = false, stringAscending = true) {
    this.field = field;
    this.descending = descending;
    this.stringAscending = stringAscending;
  }

  /**
   * if field1 is in ascend order than field2, return true
   * @param {*} field1 
   * @param {*} field2 
   */
  customizedCompare(field1, field2) {
    if (field1 === undefined || field2 === undefined || Array.isArray(field1) || (typeof field1 === 'object')) {
      return
    }
    let field1IsString = isNaN(Number(field1)) || field1 === '';
    let field2IsString = isNaN(Number(field2)) || field2 === '';

    if (field1IsString && field2IsString) {
      return field1.localeCompare(field2);
    } else if (!field1IsString && !field2IsString) {
      return field1 - field2;
    } else if (field1IsString) {
      if (this.stringAscending) {
        return true;
      } else {
        return false;
      }
    }
    else {
      if (this.stringAscending) {
        return false;
      } else {
        return true;
      }
    }
  }

  apply(jobs) {
    const { field, descending } = this;
    let comparator;
    if (field == null) {
      return jobs;
    }
    comparator = descending
      ? (a, b) => (this.customizedCompare(b[field], a[field]))
      : (a, b) => (this.customizedCompare(a[field], b[field]))
    return jobs.slice().sort(comparator);
  }
}
