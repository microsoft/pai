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


// module dependencies
const breadcrumbComponent = require('../../job/breadcrumb/breadcrumb.component.ejs');
const webportalConfig = require('../../config/webportal.config.json');
const templateDetailComponent = require('./template-detail.component.ejs');
const detailOverviewComponent = require('./detail-overview.component.ejs');
const detailQaComponent = require('./detail-qa.component.ejs');
const detailReviewComponent = require('./detail-review.component.ejs');
const detailExperimentComponent = require('./detail-experiment.component.ejs');

require('./template-detail.component.scss');


const loadSummary = () => {
  const searchParams = new URLSearchParams(window.location.search);
  const type = searchParams.get('type');
  const name = searchParams.get('name');
  const version = searchParams.get('version');
  if (!type || !name || !version) {
    window.location.href = "/template.html"
  } else {
    $.ajax({
      url: `${webportalConfig.restServerUri}/api/v1/template/${type}/${name}/${version}`,
      type: 'GET',
      dataType: 'json',
      success: function(data) {
        const template = data.job ? data.job : data;
        const templateDetailHtml = templateDetailComponent({
          breadcrumb: breadcrumbComponent,
          overview: detailOverviewComponent,
          qa: detailQaComponent,
          review: detailReviewComponent,
          experiment: detailExperimentComponent,
          detail: {
            type,
            name,
            version,
            description: template.description,
            contributor: template.contributor,
          },
        });
        $('#content-wrapper').html(templateDetailHtml);
      }
    });
    $('#btn-use').click((event) => {
      window.location.href = "/import.html" + window.location.search;
    });
  }
};

// detail page start
$(document).ready(() => {
  $('#sidebar-menu--template-view').addClass('active');
  loadSummary();
});
