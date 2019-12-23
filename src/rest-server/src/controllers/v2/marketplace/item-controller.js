const { Op } = require("sequelize");
const { isNil } = require("lodash");
const { MarketplaceItem, Tag } = require("@pai/models/v2/marketplace");
const { init } = require("@pai/middlewares/v2/init");
const asyncHandler = require("@pai/middlewares/v2/asyncHandler");

const list = asyncHandler(async (req, res, next) => {
  const result = await MarketplaceItem.list(
    req.query.name,
    req.query.author,
    req.query.category
  );
  res.status(200).json(result);
});

const create = asyncHandler(async (req, res, next) => {
  const itemId = await MarketplaceItem.create(req.body);
  res.status(201).json(itemId);
});

const get = asyncHandler(async (req, res, next) => {
  const result = await MarketplaceItem.get(req.params.itemId);
  if (isNil(result)) {
    res.status(404).send("item not found");
  } else {
    res.status(200).json(result);
  }
});

const update = asyncHandler(async (req, res, next) => {
  const result = await MarketplaceItem.update(req.params.itemId, req.body);
  if (isNil(result)) {
    res.status(404).send("item not found");
  } else {
    res.status(200).send("updated");
  }
});

const del = asyncHandler(async (req, res, next) => {
  const result = await MarketplaceItem.del(req.params.itemId);
  if (isNil(result)) {
    res.status(404).send("item not found");
  } else {
    res.status(200).send("deleted");
  }
});

const listTags = asyncHandler(async (req, res, next) => {
  const tags = await MarketplaceItem.listTags(req.params.itemId);
  if (isNil(tags)) {
    res.status(404).send("item not found");
  } else {
    res.status(200).json(tags.map(tag => tag.name));
  }
});

const updateTags = asyncHandler(async (req, res, next) => {
  const result = await MarketplaceItem.updateTags(req.params.itemId);
  if (isNil(result)) {
    res.status(404).send("item not found");
  } else {
    res.status(200).json("updated");
  }
});

const listStarUsers = asyncHandler(async (req, res, next) => {
  const users = await MarketplaceItem.listStarUsers(req.params.itemId);
  if (isNil(users)) {
    res.status(404).send("item not found");
  } else {
    res.status(200).json(users.map(user => user.name));
  }
});

// module exports
module.exports = {
  list,
  create,
  get,
  update,
  del,
  listStarUsers
};
