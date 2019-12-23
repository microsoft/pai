const express = require('express');
const itemController = require('@pai/controllers/v2/marketplace/item-controller');
const param = require('@pai/middlewares/parameter');
const marketItemInputSchema = require('@pai/config/v2/marketItem');

const router = new express.Router();

router
  .route('/items')
  .get(itemController.list)
  .post(param.validate(marketItemInputSchema.marketItemCreateInputSchema), itemController.create);

router
  .route('/items/:itemId')
  .get(itemController.get)
  .put(param.validate(marketItemInputSchema.marketItemUpdateInputSchema), itemController.update)
  .delete(itemController.del);

router
  .route('/items/:itemId/starUsers')
  .get(itemController.listStarUsers);

module.exports = router;
