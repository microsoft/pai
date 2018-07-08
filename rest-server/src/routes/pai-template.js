// module dependencies
const express = require('express');
const paiTemplateController = require('../controllers/pai-template.js');
const paiTemplateConfig = require('../config/pai-template.js');
const param = require('../middlewares/parameter');

const router = new express.Router();

router.route('/')
    /** POST /api/v1/template - List all available templates */
    .get(paiTemplateController.list);


router.route('/recommend')
    /** POST /api/v1/template/recommend - Return the hottest templates in last month */
    .get(param.getMethodValidate(paiTemplateConfig.recommendCountSchema), paiTemplateController.recommend);

// module exports
module.exports = router;
