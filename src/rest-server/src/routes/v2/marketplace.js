const express = require('express');
const marketItemController = require('@pai/controllers/v2/marketplace');

const router = new express.Router();

router.route('/items')
    .get(marketItemController.getMarketList)
    .post(marketItemController.createMarketItem);

router.route('/items/:itemId')
    .get(marketItemController.getMarketItem)
    .put(marketItemController.updateMarketItem)
    .delete(marketItemController.deleteMarketItem);

    router.route('/items/:itemId/:userName')
    .get(marketItemController.getStarRelation)
    .put(marketItemController.updateStarRelation);

module.exports = router;
