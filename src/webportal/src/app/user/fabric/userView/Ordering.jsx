// Copyright (c) Microsoft Corporation
// All rights reserved.
//
// MIT License
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
// documentation files (the "Software"), to deal in the Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
// to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
// BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

import { getVirtualCluster } from './utils';

export default class Ordering {
  /**
   * @param {"username" | "email" | "admin" | "virtualCluster"} field
   * @param {boolean | undefined} descending
   */
  constructor(field, descending = false) {
    this.field = field;
    this.descending = descending;
  }

  apply(users) {
    const { field, descending } = this;
    if (field == null) {
      return users;
    }
    let comparator;
    if (field === 'virtualCluster') {
      comparator = descending
        ? (a, b) =>
            String(getVirtualCluster(b)).localeCompare(getVirtualCluster(a))
        : (a, b) =>
            String(getVirtualCluster(a)).localeCompare(getVirtualCluster(b));
    } else {
      comparator = descending
        ? (a, b) => String(b[field]).localeCompare(a[field])
        : (a, b) => String(a[field]).localeCompare(b[field]);
    }
    return users.slice().sort(comparator);
  }
}
