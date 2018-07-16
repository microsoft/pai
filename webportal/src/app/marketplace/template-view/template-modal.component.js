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


const yaml = require('js-yaml');
const generateHtml = require('./template-modal.component.ejs');
const userAuth = require('../../user/user-auth/user-auth.component');
const webportalConfig = require('../../config/webportal.config.json');
const loading = require('../../job/loading/loading.component');

let resourceTable = null;

const initializeComponent = function() {
  userAuth.checkToken((token) => {
    $('#file-template').change(function(event) {
      var source = event.target;
      resourceTable = null;
      if (source.files && source.files[0]) {
        if (window.FileReader) {
          var file = source.files[0];
          var fr = new FileReader();
          fr.onload = function(e) {
            if (e.target.result) {
              try {
                var data = yaml.safeLoad(e.target.result);
                resources = [
                  {
                    'name': data.job.name,
                    'type': 'job',
                    'version': data.job.version
                  }
                ];
                data.prerequisites.forEach(function (element) {
                  resources.push({
                    'name': element.name,
                    'type': element.type,
                    'version': element.version
                  });
                });
                resourceTable = $('#resource-table').DataTable({
                  data: resources,
                  columns: [
                    {
                      title: 'Name',
                      data: 'name'
                    },
                    {
                      title: 'Type',
                      data: 'type'
                    },
                    {
                      title: 'Version',
                      data: 'version'
                    },
                    {
                      title: 'Include',
                      data: null,
                      orderable: false,
                      searchable: false,
                      render: function(data, type) {
                        return `<input type="checkbox" name="included" value="${data.name}:${data.version}" checked="checked" />`;
                      }
                    }
                  ],
                  'order': [
                    [0, 'asc']
                  ],
                  'autoWidth': false,
                  'deferRender': true,
                  'paging': false,
                  'info': false,
                  'searching': false
                });
                resourceTable.originData = data;
                return;
              } catch (e) {
                if (e.message) {
                  return alert(e);
                }
              }
            }
            alert('Failed to read the selected file.');
          };
          fr.readAsText(file);
        } else {
          alert('The browser does not support preview text file!');
        }
      }
    });
  });
  
  $('#btn-submit').click(function(event) {
    if (resourceTable) {
      var ajaxData = {
        'template': resourceTable.originData,
        'included': []
      }
      $('[name="included"]').each(function(index, element) {
        if (element.checked) {
          ajaxData['included'].push(element.value);
        }
      });
  
      $('#shareModal').modal('hide');
      loading.showLoading();
      userAuth.checkToken((token) => {
        $.ajax({
          type: "POST",
          url: `${webportalConfig.restServerUri}/api/v1/template`,
          headers: {
            Authorization: `Bearer ${token}`,
          },
          data: ajaxData,
          dataType: 'json',
          success: function() {
            loading.hideLoading();
            alert('success!');
            location.reload();
          },
          error: function(xhr, status, error) {
            loading.hideLoading();
            var res = JSON.parse(xhr.responseText);
            alert(res.message ? res.message : res.toString());
          }
        });
      });
    } else {
      alert('Please provide a job template first!');
    }
  });
};

module.exports = {generateHtml, initializeComponent}
