// module dependencies
const express = require('express');
const templateController = require('../controllers/template.js');
const templateConfig = require('../config/template.js');
const param = require('../middlewares/parameter');

const router = new express.Router();

router.route('/')
    /** GET /api/v1/template - List all available templates */
    .get(templateController.list);

router.route('/:name/:version')
    /** GET /api/v1/template/:name/:version - Return the template by name and version*/
    .get(templateController.get_template_by_name_and_version);

router.route('/recommend')
    /** GET /api/v1/template/recommend - Return the hottest templates in last month */
    .get(param.getMethodValidate(templateConfig.recommendCountSchema), templateController.recommend);


// module exports
module.exports = router;
