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
const express = require('express');
const vcController = require('@pai/controllers/vc');
const token = require('@pai/middlewares/token');
const param = require('@pai/middlewares/parameter');
const vcConfig = require('@pai/config/vc');

const router = new express.Router();

router.route('/')
    /** GET /api/v1/virtual-clusters - Return cluster virtual cluster info */
    .get(vcController.list);


router.route('/:vcName')
    /** GET /api/v1/virtual-clusters/vcName - Return cluster specified virtual cluster info */
    .get(vcController.get)
    /** PUT /api/v1/virtual-clusters/vcName - Update a vc */
    .put(token.checkNotApplication, param.validate(vcConfig.vcCreateInputSchema), vcController.update)
    /** DELETE /api/v1/virtual-clusters/vcName - Remove a vc */
    .delete(token.checkNotApplication, vcController.remove);


router.route('/:vcName/status')
    /** PUT /api/v1/virtual-clusters/vcName - Change vc status (running or stopped) */
    .put(token.checkNotApplication, param.validate(vcConfig.vcStatusPutInputSchema), vcController.updateStatus);


router.param('vcName', vcController.validate);

// module exports
module.exports = router;
