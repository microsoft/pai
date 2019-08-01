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

const LOCAL_STORAGE_KEY = 'pai-user-filter';

class Filter {
  /**
   * @param {Set<bool>?} admins
   * @param {Set<string>?} virtualClusters
   */
  constructor(keyword = '', admins = new Set(), virtualClusters = new Set()) {
    this.keyword = keyword;
    this.admins = admins;
    this.virtualClusters = virtualClusters;
  }

  save() {
    const content = JSON.stringify({
      admins: Array.from(this.admins),
      virtualClusters: Array.from(this.virtualClusters),
    });
    window.localStorage.setItem(LOCAL_STORAGE_KEY, content);
  }

  load() {
    try {
      const content = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      const { admins, virtualClusters } = JSON.parse(content);
      if (Array.isArray(admins)) {
        this.admins = new Set(admins);
      }
      if (Array.isArray(virtualClusters)) {
        this.virtualClusters = new Set(virtualClusters);
      }
    } catch (e) {
      window.localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }

  /**
   * @param {any[]} users
   */
  apply(users) {
    const { keyword, admins, virtualClusters } = this;

    const filters = [];
    if (keyword !== '') {
      filters.push(
        ({ username, email, virtualCluster }) =>
          username.indexOf(keyword) > -1 ||
          email.indexOf(keyword) > -1 ||
          virtualCluster.some(item => item.indexOf(keyword) > -1),
      );
    }
    if (admins.size > 0) {
      filters.push(user => admins.has(user.admin));
    }
    if (virtualClusters.size > 0) {
      filters.push(({ virtualCluster, admin }) => {
        if (admin) {
          return true;
        }
        return Array.from(virtualClusters).every(
          item => virtualCluster.indexOf(item) > -1,
        );
      });
    }
    if (filters.length === 0) return users;

    return users.filter(user => filters.every(filter => filter(user)));
  }
}

export default Filter;
