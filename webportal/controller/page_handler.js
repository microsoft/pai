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

'use strict';
var express = require('express');
var bodyParser = require('body-parser');
var fs = require('fs');
var multer = require('multer');
var mustache = require('mustache');
var request = require('request');
var config = require('../config/general_conf');

var showDocPage = (req, res) => {
  fs.readFile(__dirname + '/../public/documentation.html', function (err, content) {
    if (err) {
      res.send('Error:' + err);
    } else {
      var output = mustache.render(content.toString(), { 'clusterAddr': config.clusterMonitorAddr });
      res.send(output);
    }
  })
};

var showJobsPage = (req, res) => {
  fs.readFile(__dirname + '/../public/viewjobs.html', function (err, content) {
    if (err) {
      res.send('Error' + err);
    } else {
      var output = mustache.render(content.toString(), { 'clusterAddr': config.clusterMonitorAddr });
      res.send(output);
    }

  })
};

var showSubmitPage = (req, res) => {
  fs.readFile(__dirname + '/../public/submitjob.html', function (err, content) {
    if (err) {
      res.send('Error' + err);
    } else {
      var output = mustache.render(content.toString(), { 'clusterAddr': config.clusterMonitorAddr });
      res.send(output);
    }
  })
};

var showDownloadPage = (req, res) => {
  fs.readFile(__dirname + '/../public/download.html', function (err, content) {
    if (err) {
      res.send('Error' + err);
    } else {
      var output = mustache.render(content.toString(), { 'clusterAddr': config.clusterMonitorAddr });
      res.send(output);
    }
  })
};

module.exports = { showDocPage, showJobsPage, showSubmitPage, showDownloadPage };