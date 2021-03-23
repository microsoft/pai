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
const url = require('url')
const asyncHandler = require('@pai/middlewares/v2/asyncHandler');
const {
    ContainerClient,
  } = require('@azure/storage-blob');

const getTailLog = asyncHandler (async (req, res) => {
  const tailLogSize = 16 * 1024 * 1024; // 16 KB
  const logName = req.params.logName;
  const queryString = url.parse(req.url).query

  const account = process.env.LOG_AZURE_STORAGE_ACCOUNT;
  const containerClient = new ContainerClient(`https://${account}.blob.core.windows.net/pai-log?${queryString}`);
  const blobClient = containerClient.getBlobClient(logName);
  const properies = await blobClient.getProperties();
  const offset = properies.contentLength - tailLogSize < 0 ? 0 : properies.contentLength - tailLogSize;
  const buffer = await blobClient.downloadToBuffer(offset, properies.contentLength - offset);
  res.status(206).send(buffer);
});

// module exports
module.exports = { getTailLog };