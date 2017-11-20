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

var express = require('express');
var bodyParser = require('body-parser');
var fs = require('fs');
var multer = require('multer');
var request = require('request');
var config = require('../config/general_conf');

var submitFile = (req, res) => {
  fs.readFile(req.file.path, function (err, data) {
    if (err) {
      res.send({
        'error': true,
        'msg': 'File Upload Error'
      })
    } else {
      try {
        var jobConfig = JSON.parse(data.toString());
        console.log('data:', data.toString());
        request({
          url: config.restServerAddr + '/api/job/' + jobConfig.jobName,
          method: 'PUT',
          json: jobConfig
        }, function (error, response, body) {
          if (error) {
            res.send({ 'error': true, 'msg': 'Can not connect to Server' });
          } else {
            if (body.error) {
              res.send({ 'error': true, 'msg': body.message });
            } else {
              res.send({ 'msg': 'success' });
            }
          }
        })
      } catch (ex) {
        console.log(ex);
        res.send({ 'error': true, 'msg': 'File Format Error' });
      }
    }
  })
};

var getFiles = (req, res) => {
  if (req.query.type == "download") {
    fs.readdir(__dirname + '/../public/download', function (err, files) {
      if (err) {
        res.send({ 'error': true, 'msg': 'can not find the path' });
      } else {
        res.send({ 'list': files });
      }
    })
  }

};

module.exports = { submitFile, getFiles };