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
var request = require('request');
var dateFormat = require('dateformat');
var config = require('../config/general_conf');

var listJobs = (req, res) => {
  request.get(config.restServerAddr + '/api/job', function (error, reponse, body) {
    if (error) {
      return res.json({ 'error': true, 'msg': error });
    } else {
      console.log(body);
      if (body.error) {
        res.send({ 'error': true, 'msg': body.message });
      } else {
        res.send(body);
      }
    }
  })
};

var deleteJob = (req, res) => {
  console.log(req.params, ' ** ', req.query);
  request.delete(config.restServerAddr + '/api/job/' + req.params.jobName, function (error, response, body) {
    if (error) {
      res.send({ 'error': true, 'msg': error });
    } else {
      res.send({ 'msg': 'success' });
    }
  })
};

module.exports = { listJobs, deleteJob };