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
const crudUtil = require('../../util/manager/user/crudUtil');
const createError = require('../../util/error');

const crudType = 'k8sSecret';
const crudUser = crudUtil.getStorageObject(crudType);
const crudConfig = crudUser.initConfig(process.env.K8S_APISERVER_URI);

const getUser = async (username, next) => {
  try {
    return await crudUser.read(username, crudConfig);
  } catch (error) {
    if (error.status === 404) {
      return next(createError('Not Found', 'NoUserError', `User ${username} not found.`));
    } else {
      return next(error);
    }
  }
};

// module exports
module.exports = {getUser};
