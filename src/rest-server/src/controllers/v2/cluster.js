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
const axios = require('axios');
const status = require('statuses');
const createError = require('@pai/utils/error');
const { resourceUnits } = require('@pai/config/vc');
const { hivedWebserviceUri } = require('@pai/config/launcher');
const asyncHandler = require('@pai/middlewares/v2/asyncHandler');

const getSkuTypes = asyncHandler(async (req, res) => {
  if (req.query.vc) {
    let vcStatus;
    try {
      vcStatus = (
        await axios.get(
          `${hivedWebserviceUri}/v1/inspect/clusterstatus/virtualclusters/${req.query.vc}`,
        )
      ).data;
    } catch (error) {
      throw createError(
        'Not Found',
        'NoVirtualClusterError',
        `Cannot get sku types for virtual clyster ${req.query.vc}.`,
      );
    }
    const leafCellTypes = new Set(vcStatus.map((cell) => cell.leafCellType));
    const skuTypes = Object.keys(resourceUnits)
      .filter((key) => leafCellTypes.has(key))
      .reduce((obj, key) => {
        obj[key] = resourceUnits[key];
        return obj;
      }, {});
    res.status(status('OK')).json(skuTypes);
  } else {
    res.status(status('OK')).json(resourceUnits);
  }
});

module.exports = { getSkuTypes };
