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

const k8s = require('@kubernetes/client-node');
const kc = new k8s.KubeConfig();
const logger = require('@alert-handler/common/logger');

kc.loadFromDefault();
const k8sApi = kc.makeApiClient(k8s.CoreV1Api);

const cordonNodes = async (req, res, next) => {
  logger.info(
    'alert-handler received `cordonNode` post request from alert-manager.',
  );

  const firing_alerts = req.body.alerts.filter(alert => alert.status === 'firing' && alert.labels.node_name);
  try {
    await Promise.all(firing_alerts.map(async alert => {
      const nodeName = alert.labels.node_name;
      const headers = {
        'content-type': 'application/strategic-merge-patch+json',
      };
      k8sApi
      .patchNode(
        nodeName,
        { spec: { unschedulable: true } },
        undefined,
        undefined,
        undefined,
        undefined,
        { headers },
      )
    }))
  } catch(err) {
    logger.error(`alert-handler failed to cordon node ${nodeName}`, err);
    next(createError(500, `alert-handler failed to cordon node ${nodeName}`));
  }
  res.status(200).json({
    message: `alert-handler successfully cordon nodes`,
  });
};

// module exports
module.exports = {
  cordonNodes,
};
