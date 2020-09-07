// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

// module dependencies
const express = require('express');
const userRouter = require('@pai/routes/v2/user');
const groupRouter = require('@pai/routes/v2/group');
const storageRouter = require('@pai/routes/v2/storage');
const storageDeprecatedRouter = require('@pai/routes/v2/storage-deprecated');
const controller = require('@pai/controllers/v2');
const jobRouter = require('@pai/routes/v2/job');
const clusterRouter = require('@pai/routes/v2/cluster');
const virtualClusterRouter = require('@pai/routes/v2/virtual-cluster');
const authnRouter = require('@pai/routes/authn');
const infoController = require('@pai/controllers/v2/info');
const tokenRouter = require('@pai/routes/token');
const k8sRouter = require('@pai/routes/kubernetes');

const router = new express.Router();

router.route('/').all(controller.index);
router.route('/info').all(infoController.info);

router.use('/jobs', jobRouter);
router.use('/cluster', clusterRouter);
router.use('/virtual-clusters', virtualClusterRouter);

router.use('/authn', authnRouter);
router.use('/user', userRouter);
router.use('/users', userRouter);
router.use('/group', groupRouter);
router.use('/groups', groupRouter);

router.use('/storages', storageRouter);
router.use('/storage', storageDeprecatedRouter);
router.use('/tokens', tokenRouter);
router.use('/kubernetes', k8sRouter);

// module exports
module.exports = router;
