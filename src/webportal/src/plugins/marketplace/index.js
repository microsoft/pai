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

const querystring = require('querystring');

class MarketplaceElement extends HTMLElement {
  connectedCallback() {
    if (!this.isConnected) return;

    const self = this;
    const qs = location.search.replace(/^\?+/, ''); // Strip leading question marks
    const query = querystring.parse(qs);
    const type = query['type'];
    const name = query['name'];

    const restServerUri = this.getAttribute('pai-rest-server-uri');

    if (typeof type === 'string') {
      if (typeof name === 'string') {
        // Render template-detail page
        require.ensure(['./template-detail/template-detail.component'],
          function(require) {
            require('./template-detail/template-detail.component')(self, restServerUri, query);
          });
      } else {
        // Render template-list page
        require.ensure(['./template-list/template-list.component'],
          function(require) {
            require('./template-list/template-list.component')(self, restServerUri, query);
          });
      }
    } else {
      // Render template-view page
      require.ensure(['./template-view/template-view.component'],
        function(require) {
          require('./template-view/template-view.component')(self, restServerUri, query);
        });
    }
  }
}

window.customElements.define('pai-plugin', MarketplaceElement);
