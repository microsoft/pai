const marketItemModel = require('@pai/models/v2/market-item');

const getMarketList = async (req, res) => {
  try {
    const marketList = await marketItemModel.getMarketList();
    if (marketList.length === 0) {
      return res.status(404).json({message: 'Not Found'});
    } else {
      return res.status(200).json(marketList);
    }
  } catch (error) {
    return res.status(500).json({
      message: 'Service Internal Error',
    });
  }
};

const createMarketItem = async (req, res) => {
  const marketItem =[
    req.body.id,
    req.body.name,
    req.body.author,
    req.body.createDate,
    req.body.updateDate,
    req.body.category,
    req.body.tags,
    req.body.introduction,
    req.body.description,
    req.body.jobConfig,
    req.body.submits,
    req.body.stars,
  ];

  try {
    await marketItemModel.createMarketItem(marketItem);
    return res.status(201).json({message: 'MerketItem is created successfully'});
  } catch (error) {
    return res.status(500).json({message: 'Service Internal Error'});
  }
};

const getMarketItem = async (req, res) => {
  var itemId = req.params.itemId;
  try {
    const marketItem = await marketItemModel.getMarketItem(itemId);
    if (marketItem === null) {
      return res.status(404).json({message: 'Marketplace item not found'});
    } else {
      return res.status(200).json({
        id: marketItem.id,
        name: marketItem.name,
        author: marketItem.author,
        createDate: marketItem.createdate,
        updateDate: marketItem.updatedate,
        category: marketItem.category,
        tags: marketItem.tags,
        introduction: marketItem.introduction,
        description: marketItem.description,
        jobConfig: marketItem.jobconfig,
        submits: marketItem.submits,
        stars: marketItem.stars,
      });
    }
  } catch (error) {
    return res.status(500).json({message: 'Service Internal Error'});
  }
};

const updateMarketItem = async (req, res) => {
  const itemId = req.params.itemId;
  const data = [req.body.name, req.body.updateDate, req.body.category, req.body.tags, req.body.introduction, req.body.description, itemId];
  try {
    await marketItemModel.updateMarketItem(data);
    return res.status(201).json({message: 'MarketItem updated successfully'});
  } catch (error) {
    return res.status(500).json({message: 'Service Internal Error'});
  }
};

const deleteMarketItem = async (req, res) => {
  const itemId = req.params.itemId;
  try {
    await marketItemModel.deleteMarketItem(itemId);
    return res.status(200).json({message: 'MarketItem deleted successfully'});
  } catch (error) {
    return res.status(500).json({message: 'Service Internal Error'});
  }
};

const getStarRelation = async (req, res) => {
  const itemId = req.params.itemId;
  const userName = req.params.userName;
  try {
    const result = await marketItemModel.getStarRelation(itemId, userName);
    if (result) {
      return res.status(200).json({message: 'true'});
    } else {
      return res.status(200).json({message: 'false'});
    }
  } catch (error) {
    return res.status(500).json({message: 'service internal error'});
  }
};

const updateStarRelation = async (req, res) => {
  const itemId = req.params.itemId;
  const userName = req.params.userName;

  try {
    const result = await marketItemModel.getStarRelation(itemId, userName);
    if (result) {
      await marketItemModel.deleteStarRelation(itemId, userName);
      return res.status(201).json({message: 'false'});
    } else {
      await marketItemModel.addStarRelation(itemId, userName);
      return res.status(201).json({message: 'true'});
    }
  } catch (error) {
    return res.status(500).json({message: 'service internal error', });
  }
};

module.exports = {
  getMarketList,
  createMarketItem,
  getMarketItem,
  updateMarketItem,
  deleteMarketItem,
  getStarRelation,
  updateStarRelation,
};
