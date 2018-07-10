// module dependencies
const express = require('express');
const templateController = require('../controllers/template.js');
const templateConfig = require('../config/template.js');
const param = require('../middlewares/parameter');

const router = new express.Router();

router.route('/')
    /** POST /api/v1/template - List all available templates */
    .get(templateController.list);

router.route('/recommend')
    /** POST /api/v1/template/recommend - Return the hottest templates in last month */
    .get(param.getMethodValidate(templateConfig.recommendCountSchema), templateController.recommend);

// module exports
module.exports = router;
