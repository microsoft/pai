const express = require('express');
const marketItemController = require('@pai/controllers/v2/marketplace');
const param = require('@pai/middlewares/parameter');
const marketItemInputSchema = require('@pai/config/v2/marketItem');

const router = new express.Router();

router.route('/items')
    .get(marketItemController.getMarketList)
    .post(param.validate(marketItemInputSchema.marketItemCreateInputSchema), marketItemController.createMarketItem);

router.route('/items/:itemId')
    .get(marketItemController.getMarketItem)
    .put(param.validate(marketItemInputSchema.marketItemUpdateInputSchema), marketItemController.updateMarketItem)
    .delete(marketItemController.deleteMarketItem);

router.route('/items/:itemId/:userName')
    .get(marketItemController.getStarRelation)
    .put(marketItemController.updateStarRelation);

module.exports = router;
