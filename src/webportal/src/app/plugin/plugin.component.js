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

require('@webcomponents/custom-elements');

function loadScript(uri, callback) {
  const script = document.createElement('script');
  script.addEventListener('load', loadHandler);
  script.src = uri;
  document.head.appendChild(script);

  function loadHandler() {
    script.removeEventListener('load', loadHandler);
    document.head.removeChild(script);
    callback();
  }
}

$(document).ready(function() {
  const query = new URLSearchParams(window.location.search);
  const index = Number(query.get('index'));
  const plugin = window.PAI_PLUGINS[index];

  if (plugin == null) {
    alert('Plugin Not Found');
    location.href = '/';
  }

  $('.sidebar-menu .plugin-' + index).addClass('active');

  loadScript(plugin.uri, function() {
    const $plugin = $('<pai-plugin>')
      .attr('pai-rest-server-uri', window.ENV.restServerUri)
      .attr('pai-version', window.PAI_VERSION);
    if (cookies.get('token')) {
      $plugin
        .attr('pai-user', cookies.get('user'))
        .attr('pai-rest-server-token', cookies.get('token'));
    }
    $('#content-wrapper')
      .empty()
      .append($plugin);
  });
});
