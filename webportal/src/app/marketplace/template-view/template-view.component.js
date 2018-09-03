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


require('slick-carousel');
require('slick-carousel/slick/slick.css');
const url = require('url');

require('./template-view.component.css');
const template = require('./template-view.component.ejs');
const slideTemplate = require('./template-view.slide.component.ejs');
const webportalConfig = require('../../config/webportal.config.js');
const userAuth = require('../../user/user-auth/user-auth.component');

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
            $slick.slick('slickRemove', 1);
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
        search($(this).find('input').val());
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
            $('#upload-body-select').removeClass('hidden');
            $('#upload-body-form').addClass('hidden');
            $('#upload-body-success').addClass('hidden');
        });

        $('#upload-docker, #upload-script, #upload-data').click(() => {
            $('#upload-body-select').addClass('hidden');
            $('#upload-body-form').removeClass('hidden');
        });
        $('#upload-body-form').submit((event) => {
            event.preventDefault();
            $('#upload-body-form').addClass('hidden');
            const name = $('#upload-body-form :input[id=upload-name]').val();
            const description = $('#upload-body-form :input[id=upload-description]').val();
            const uri = $('#upload-body-form :input[id=upload-uri]').val();
            userAuth.checkToken((token) => {
                $.ajax({
                    url: `${webportalConfig.restServerUri}/api/v2/template`,
                    data: {
                        type: 'dockerimage',
                        name: name,
                        version: '1.0.0',
                        contributor: cookies.get('user'),
                        uri: uri,
                        description: description,
                    },
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

