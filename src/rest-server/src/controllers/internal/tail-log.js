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
const status = require('statuses');

const asyncHandler = require('@pai/middlewares/v2/asyncHandler');
const { ContainerClient } = require('@azure/storage-blob');

const launcherConfig = require('@pai/config/launcher');
const logger = require('@pai/config/logger');
const createError = require('@pai/utils/error');

const getTailLog = asyncHandler(async (req, res) => {
  const tailLogSize = 16 * 1024; // 16 KB
  const logName = req.params.logName;
  const queryString = req.url.substring(req.url.indexOf('?') + 1);
  const account = launcherConfig.logAzureStorageAccount;

  try {
    const containerClient = new ContainerClient(
      `https://${account}.blob.core.windows.net/pai-log?${queryString}`,
    );
    const blobClient = containerClient.getBlobClient(logName);
    const properties = await blobClient.getProperties();
    const offset =
      properties.contentLength - tailLogSize < 0
        ? 0
        : properties.contentLength - tailLogSize;
    const buffer = await blobClient.downloadToBuffer(
      offset,
      properties.contentLength - offset,
    );
    res.status(status('Partial Content')).send(buffer);
  } catch (error) {
    logger.error(`Got error when retrieving tail log, error: ${error}`);
    throw createError(
      'Internal Server Error',
      'UnknownError',
      'Failed to get tail log',
    );
  }
});

// module exports
module.exports = { getTailLog };
