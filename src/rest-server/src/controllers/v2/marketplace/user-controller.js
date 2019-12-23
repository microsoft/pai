const { User } = require("@pai/models/v2/marketplace/user");
const { isEmpty, isNil } = require("lodash");
const asyncHandler = require("@pai/middlewares/v2/asyncHandler");

const list = asyncHandler(async (req, res, next) => {
  const items = await User.listItems(req.params.username);
  if (isNil(items)) {
    res.status(404).send("user not found");
  } else {
    res.status(200).json(items);
  }
});

const get = asyncHandler(async (req, res, next) => {
  const items = await User.getItem(req.params.username, req.params.itemId);
  if (isNil(items)) {
    res.status(404).send("user not found");
  } else if (isEmpty(items)) {
    res.status(404).send("item not found");
  } else {
    res.status(200).json(items[0]);
  }
});

const update = asyncHandler(async (req, res, next) => {
  const result = await User.updateItem(req.params.username, req.params.itemId);
  if (isNil(result)) {
    res.status(404).send("user not found");
  } else if (result === "item not exists") {
    res.status(404).send("item not exists");
  } else if (result === false) {
    res.status(409).send("conflict");
  } else if (result === true) {
    res.status(200).send("ok");
  }
});

const del = asyncHandler(async (req, res, next) => {
  const result = await User.deleteItem(req.params.username, req.params.itemId);
  if (isNil(result)) {
    res.status(404).send("user not found");
  } else if (result === false) {
    res.status(404).send("item not found");
  } else if (result === true) {
    res.status(200).send("ok");
  }
});

// module exports
module.exports = {
  list,
  get,
  update,
  del
};
