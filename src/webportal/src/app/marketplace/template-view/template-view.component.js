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


require('json-editor'); /* global JSONEditor */
require('slick-carousel');
require('slick-carousel/slick/slick.css');
const url = require('url');

require('./template-view.component.css');
const template = require('./template-view.component.ejs');
const slideTemplate = require('./template-view.slide.component.ejs');
const webportalConfig = require('../../config/webportal.config.js');
const userAuth = require('../../user/user-auth/user-auth.component');
const jobSchema = require('../job-submit/sub-components/json-editor-schema.js');
const yamlHelper = require('../job-submit/sub-components/yaml-json-editor-convert.js');
const githubThrottled = require('../template-common/github-throttled');

const slideContext = {
  parseType: function parseType(rawType) {
    return {
      'job': 'job',
      'dockerimage': 'docker',
      'script': 'script',
      'data': 'data',
    }[rawType] || 'job';
  },
};

let uploadData = {};

function prepareCarousel($carousel) {
  const $prev = $('<a class="btn btn-link"><span class="glyphicon glyphicon-menu-left"></span></a>')
    .appendTo($carousel);
  const $slick = $('<div></div>')
    .appendTo($carousel);
  const $next = $('<a class="btn btn-link"><span class="glyphicon glyphicon-menu-right"></span></a>')
    .appendTo($carousel);
  $carousel.empty().append($prev, $slick, $next);

  setTimeout(function() {
    $slick.slick({
      slidesToShow: 5,
      slidesToScroll: 5,
      swipe: false,
      infinite: false,
      prevArrow: $prev,
      nextArrow: $next,
    });
  });

  return $slick;
}

function loadCarousel($slick, type, page) {
  const requestId = Date.now();
  $slick.data('request-id', requestId);
  $slick.parents('section').find('h2 a').addClass('hidden');

  function apply(page) {
    if ($slick.data('request-id') !== requestId) return;
    $.getJSON(`${webportalConfig.restServerUri}/api/v2/template/${type}`, {pageno: page})
      .then(function(data) {
        if ($slick.data('request-id') !== requestId) return;

        $(slideTemplate.call(slideContext, data)).each(function() {
          $slick.slick('slickAdd', this);
        });

        if (data.pageNo * data.pageSize < Math.min(data.totalCount, 30)) {
          setTimeout(apply, 100, page + 1);
        }

        if (data.totalCount > 5) {
          $slick.parents('section').find('h2 a')
            .removeClass('hidden')
            .attr('href', '/template-list.html?type=' + slideContext.parseType(type));
        }
      });
  }
  setTimeout(apply, 0, 1);
}

function search(query) {
  function clear($slick) {
    const slideCount = $slick.find('.thumbnail').length;
    for (let i = 0; i < slideCount; i += 1) {
      $slick.slick('slickRemove', 0);
    }
    return $slick;
  }

  const requestId = Date.now();

  const $jobsSlick = clear($('#marketplace-jobs .slick-slider')).data('request-id', requestId);
  const $dockersSlick = clear($('#marketplace-dockers .slick-slider')).data('request-id', requestId);
  const $scriptsSlick = clear($('#marketplace-scripts .slick-slider')).data('request-id', requestId);
  const $dataSlick = clear($('#marketplace-datas .slick-slider')).data('request-id', requestId);

  $jobsSlick.parents('section').find('h2 a').addClass('hidden');
  $dockersSlick.parents('section').find('h2 a').addClass('hidden');
  $scriptsSlick.parents('section').find('h2 a').addClass('hidden');
  $dataSlick.parents('section').find('h2 a').addClass('hidden');

  setTimeout(append, 0, 1);

  function append(page) {
    if ($jobsSlick.data('request-id') !== requestId) return;

    userAuth.checkToken((token) => {
      $.ajax({
        url: `${webportalConfig.restServerUri}/api/v2/template`,
        type: 'GET',
        dataType: 'json',
        data: {
          query: query,
          pageno: page,
        },
        beforeSend: function setHeader(xhr) {
          if (token) {
            // Used for the backend server to fetch current user's GitHub PAT
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
          }
        },
        success: function(data) {
          if ($jobsSlick.data('request-id') !== requestId) return;

          const items = data.items;

          $(slideTemplate.call(slideContext, {
            items: items.filter(function(item) {
              return item.type === 'job';
            }),
          })).each(function(index, element) {
            $jobsSlick.slick('slickAdd', element);
          });
          if ($jobsSlick.find('.thumbnail').length > 5) {
            $jobsSlick.parents('section').find('h2 a')
              .removeClass('hidden')
              .attr('href', '/template-list.html?type=job&query=' + query);
          }

          $(slideTemplate.call(slideContext, {
            items: items.filter(function(item) {
              return item.type === 'dockerimage';
            }),
          })).each(function(index, element) {
            $dockersSlick.slick('slickAdd', element);
          });
          if ($dockersSlick.find('.thumbnail').length > 5) {
            $dockersSlick.parents('section').find('h2 a')
              .removeClass('hidden')
              .attr('href', '/template-list.html?type=docker&query=' + query);
          }

          $(slideTemplate.call(slideContext, {
            items: items.filter(function(item) {
              return item.type === 'script';
            }),
          })).each(function(index, element) {
            $scriptsSlick.slick('slickAdd', element);
          });
          if ($scriptsSlick.find('.thumbnail').length > 5) {
            $scriptsSlick.parents('section').find('h2 a')
              .removeClass('hidden')
              .attr('href', '/template-list.html?type=script&query=' + query);
          }

          $(slideTemplate.call(slideContext, {
            items: items.filter(function(item) {
              return item.type === 'data';
            }),
          })).each(function(index, element) {
            $dataSlick.slick('slickAdd', element);
          });
          if ($dataSlick.find('.thumbnail').length > 5) {
            $dataSlick.parents('section').find('h2 a')
              .removeClass('hidden')
              .attr('href', '/template-list.html?type=data&query=' + query);
          }

          if (data.pageNo * data.pageSize < Math.min(data.totalCount, 150)) {
            setTimeout(append, 100, page + 1);
          }
        },
        error: function(jqxhr, _, error) {
          if (jqxhr.status == 500) {
            githubThrottled();
          } else {
            alert(error);
          }
        },
      });
    }, false);
  }
}

$('#sidebar-menu--template-view').addClass('active');

$(function() {
  const query = url.parse(window.location.href, true).query;
  $('#content-wrapper').html(template(query));
  $('#search').submit(function(event) {
    event.preventDefault();
    let query = $(this).find('input').val();
    if (query) {
      search(query);
    } else {
      // No query, list popular templates
      window.location.reload(false);
    }
  });
  prepareCarousel($('#marketplace-jobs'));
  prepareCarousel($('#marketplace-dockers'));
  prepareCarousel($('#marketplace-scripts'));
  prepareCarousel($('#marketplace-datas'));

  setTimeout(() => {
    if (query.query) {
      $('#search input').val(query.query);
      search(query.query);
    } else {
      loadCarousel($('#marketplace-jobs .slick-slider'), 'job');
      loadCarousel($('#marketplace-dockers .slick-slider'), 'dockerimage');
      loadCarousel($('#marketplace-scripts .slick-slider'), 'script');
      loadCarousel($('#marketplace-datas .slick-slider'), 'data');
    }

    $('#upload-button').click(() => {
      userAuth.checkToken((token) => {
        $('#upload-modal-title').html('Upload New Item');
        $('#upload-body-select').removeClass('hidden');
        $('#upload-body-form-container').addClass('hidden');
        $('#upload-body-success').addClass('hidden');
      });
    });

    $('#upload-docker').click(() => {
      makeUploadDialog('Upload DockerImage', 'dockerimage', 'dockerimageSchema');
    });

    $('#upload-script').click(() => {
      makeUploadDialog('Upload Script', 'script', 'scriptSchema');
    });

    $('#upload-data').click(() => {
      makeUploadDialog('Upload Data', 'data', 'dataSchema');
    });

    function makeUploadDialog(dialogTitle, uploadDataType, uploadFormSchema) {
      $('#upload-modal-title').html(dialogTitle);
      $('#upload-body-select').addClass('hidden');
      $('#upload-body-form-container').removeClass('hidden');
      let element = document.getElementById('upload-body-form');
      element.innerHTML = '';
      let editor = new JSONEditor(element, {
        schema: jobSchema[uploadFormSchema],
        theme: 'bootstrap3',
        iconlib: 'bootstrap3',
        disable_array_reorder: true,
        no_additional_properties: true,
        show_errors: 'change',
        disable_properties: true,
        startval: {
          'protocol_version': 'v2',
          'version': '1.0.0',
          'contributor': cookies.get('user'),
        },
      });
      editor.on('change', () => {
        let error = editor.validate();
        if (error.length == 0) {
          uploadData = editor.getValue();
          uploadData['type'] = uploadDataType;
        }
      });
    }

    $('#upload-submit').click(() => {
      $('#upload-body-form-container').addClass('hidden');
      upload(false /* isYamlFile*/);
    });

    $('#upload-yaml').change(function(evt) {
      let files = evt.target.files;
      if (files.length) {
        let f = files[0];
        let reader = new FileReader(); // read the local file
        reader.onload = function(e) {
          uploadData = yamlHelper.jsonToJsonEditor(yamlHelper.yamlLoad(e.target.result));
          if (uploadData) {
            $('#upload-body-select').addClass('hidden');
            upload(true /* isYamlFile*/);
          }
        };
        reader.readAsText(f);
      }
    });

    function upload(isYamlFile) {
      userAuth.checkToken((token) => {
        $.ajax({
          url: `${webportalConfig.restServerUri}/api/v2/template`,
          data: uploadData,
          type: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          dataType: 'json',
          success: (data) => {
            $('#upload-body-success').removeClass('hidden');
          },
          error: (xhr, textStatus, error) => {
            if (isYamlFile) {
              $('#upload-body-select').removeClass('hidden');
            } else {
              $('#upload-body-form-container').removeClass('hidden');
            }
            const res = JSON.parse(xhr.responseText);
            alert(res.message);
          },
        });
      });
    }
  });
});
