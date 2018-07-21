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


require('bootstrap/js/modal.js');
require('datatables.net/js/jquery.dataTables.js');
require('datatables.net-bs/js/dataTables.bootstrap.js');
require('datatables.net-bs/css/dataTables.bootstrap.css');
require('datatables.net-plugins/sorting/natural.js');
require('./template-view.component.scss');
require('./template-detail.component.scss');
require('./overview.scss');
require('./rating.scss');

const detailComponent = require('./template-detail.component.ejs');
const overviewComponent = require('./overview.ejs');
const qaComponent = require('./qa.ejs');
const ratingComponent = require('./rating.ejs');
const experComponent = require('./experiments.ejs');

$('#content-wrapper').html(detailComponent());
$('#main_con').html(overviewComponent());

$(window).resize(function(event) {
  $('#content-wrapper').css({'height': $(window).height() + 'px'});
});

// detail page start
$(document).ready(() => {
  $('#sidebar-menu--template-view').addClass('active');
  $('#content-wrapper').css({'overflow': 'auto'});
  $('.nav li').click(function () {
    $(this).addClass('active').siblings().removeClass('active');
    let pan = $(this).index();
    switch (pan) {
      case 0: $('#main_con').html(overviewComponent());break;
      case 1: $('#main_con').html(qaComponent());break;
      case 2: $('#main_con').html(ratingComponent());break;
      case 3: $('#main_con').html(experComponent());break;
    }
  });
  window.dispatchEvent(new Event('resize'));
});
