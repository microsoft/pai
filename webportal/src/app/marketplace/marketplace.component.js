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

const template = require('./marketplace.component.ejs');
require('./marketplace.component.css');
require('slick-carousel');
require('slick-carousel/slick/slick.css');
const userAuth = require('../user/user-auth/user-auth.component');
const webportalConfig = require('../config/webportal.config.js');
// require('slick-carousel/slick/slick-theme.css');

$(function() {
    $('#content-wrapper').html(template());

    setTimeout(() => {
        $('#marketplace-jobs').slick({
            infinite: true,
            slidesToShow: 5,
            swipe: false,
            prevArrow: $('#marketplace-jobs-prev'),
            nextArrow: $('#marketplace-jobs-next'),
        });
        $('#marketplace-dockers').slick({
            infinite: true,
            slidesToShow: 5,
            swipe: false,
            prevArrow: $('#marketplace-dockers-prev'),
            nextArrow: $('#marketplace-dockers-next'),
        });
        $('#marketplace-scripts').slick({
            infinite: true,
            slidesToShow: 5,
            swipe: false,
            prevArrow: $('#marketplace-scripts-prev'),
            nextArrow: $('#marketplace-scripts-next'),
        });
        $('#marketplace-datas').slick({
            infinite: true,
            slidesToShow: 5,
            swipe: false,
            prevArrow: $('#marketplace-datas-prev'),
            nextArrow: $('#marketplace-datas-next'),
        });

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

