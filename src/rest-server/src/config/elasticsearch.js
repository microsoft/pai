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
const cors = require('cors');
const morgan = require('morgan');
const express = require('express');
const compress = require('compression');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const config = require('@pai/config');
const logger = require('@pai/config/logger');
const createError = require('@pai/utils/error');
const launcherConfig = require('@pai/config/launcher');
const historyController = require(`@pai/controllers/v2/history`);

const esApp = express();

esApp.set('json spaces', config.env === 'development' ? 4 : 0);

esApp.use(cors());
esApp.use(compress());
esApp.use(bodyParser.urlencoded({extended: true}));
esApp.use(bodyParser.json());
esApp.use(bodyParser.text({type: 'text/*'}));
esApp.use(cookieParser());

// setup the logger for requests
esApp.use(morgan('dev', {'stream': logger.stream}));

// GET Framework All History Snapshots by FrameworkNamespace & FrameworkName
esApp.get(`/apis/${launcherConfig.apiVersion}/namespaces/:frameworkNamespace/frameworks/:frameworkName`, historyController.getFrameworkByName);

// GET Framework All History Snapshots by FrameworkUID
esApp.get(`/apis/${launcherConfig.apiVersion}/frameworks/:frameworkUID`, historyController.getFrameworkByUID);

// GET Framework One Attempt History Snapshot by FrameworkNamespace & FrameworkName & FrameworkAttemptID
esApp.get(`/apis/${launcherConfig.apiVersion}/namespaces/:frameworkNamespace/frameworks/:frameworkName/attempts/:frameworkAttemptID`, historyController.getFramworkByNameAndAttemptID); 

// GET Framework One Attempt History Snapshot by FrameworkUID & FrameworkAttemptID
esApp.get(`/apis/${launcherConfig.apiVersion}/frameworks/:frameworkUID/attempts/:frameworkAttemptID`, historyController.getFramworkByUIDAndAttemptID);

// GET Pod All History by PodNamespace & PodName
esApp.get('/api/v1/namespaces/:PodNamespace/pods/:podName', historyController.getPodByName);

// GET Pod All History by PodUID
esApp.get('/api/v1/pods/:podUID', historyController.getPodByUID);

// GET Pod Last History by PodNamespace & PodName
esApp.get('/api/v1/namespaces/:PodNamespace/pods/:podName/last', historyController.getPodByNameLast);

// GET Pod Last History by PodUID
esApp.get('/api/v1/pods/:podUID/last', historyController.getPodByUIDLast);

// catch 404 and forward to error handler
esApp.use((req, res, next) => {
  next(createError('Not Found', 'NoApiError', `API ${req.url} is not found.`));
});

// error handler
esApp.use((err, req, res, next) => {
  logger.warn(err.stack);
  res.status(err.status || 500).json({
    code: err.code,
    message: err.message,
    stack: config.env === 'development' ? err.stack.split('\n') : void 0,
  });
});

// module exports
module.exports = esApp;
