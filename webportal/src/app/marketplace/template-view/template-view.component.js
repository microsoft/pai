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

let uploadData ={};

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

    const url = `${webportalConfig.restServerUri}/api/v2/template/${type}`;

    setTimeout(apply, 0, 1);

    return;

    function apply(page) {
        if ($slick.data('request-id') !== requestId) return;
        $.getJSON(url, {pageno: page})
            .then(function(data) {
                if ($slick.data('request-id') !== requestId) return;

                $(slideTemplate.call(slideContext, data)).each(function() {
                    $slick.slick('slickAdd', this);
                });

                if (data.pageNo * data.pageSize < Math.min(data.totalCount, 30)) {
                    setTimeout(apply, 100, page + 1);
                }
            });
    }
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

    const url = `${webportalConfig.restServerUri}/api/v2/template`;

    setTimeout(append, 0, 1);

    function append(page) {
        if ($jobsSlick.data('request-id') !== requestId) return;

        $.getJSON(url, {query: query, pageno: page})
            .then(function(data) {
                if ($jobsSlick.data('request-id') !== requestId) return;

                const items = data.items;

                $(slideTemplate.call(slideContext, {
                    items: items.filter(function(item) {
                        return item.type === 'job';
                    }),
                })).each(function() {
                    $jobsSlick.slick('slickAdd', this);
                });
                $(slideTemplate.call(slideContext, {
                    items: items.filter(function(item) {
                        return item.type === 'dockerimage';
                    }),
                })).each(function() {
                    $dockersSlick.slick('slickAdd', this);
                });
                $(slideTemplate.call(slideContext, {
                    items: items.filter(function(item) {
                        return item.type === 'script';
                    }),
                })).each(function() {
                    $scriptsSlick.slick('slickAdd', this);
                });
                $(slideTemplate.call(slideContext, {
                    items: items.filter(function(item) {
                        return item.type === 'data';
                    }),
                })).each(function() {
                    $dataSlick.slick('slickAdd', this);
                });

                if (data.pageNo * data.pageSize < Math.min(data.totalCount, 150)) {
                    setTimeout(append, 100, page + 1);
                }
            });
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
                $('#upload-body-select').removeClass('hidden');
                $('#upload-body-form').addClass('hidden');
                $('#upload-body-success').addClass('hidden');
                $('#upload-submit').addClass('hidden');
            });
        });

        $('#upload-docker').click(() => {
            makeUploaDialog('Upload DockerImage', 'dockerimage', 'dockerimageSchema');
        });
        
        $('#upload-script').click(() => {
            makeUploaDialog('Upload Script', 'script', 'scriptSchema');
        });

        $('#upload-data').click(() => {
            makeUploaDialog('Upload Data', 'data', 'dataSchema');
        });

        function makeUploaDialog(dialogTitle, uploadDataType, uploadFormSchema){
            $('#upload-modal-title').html(dialogTitle);
            $('#upload-body-select').addClass('hidden');
            $('#upload-body-form').removeClass('hidden');
            $('#upload-submit').removeClass('hidden');
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
            $('#upload-body-form').addClass('hidden');
            $('#upload-submit').addClass('hidden');
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
                        $('#upload-body-form').removeClass('hidden');
                        const res = JSON.parse(xhr.responseText);
                        alert(res.message);
                    },
                });
            });
        });
    });
});

